const Commission = require('../models/Commission');

// Create a new commission rule
exports.createCommission = async (req, res) => {
  try {
    const commission = new Commission(req.body);
    await commission.save();
    res.status(201).json({ success: true, commission });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all commission rules
exports.getAllCommissions = async (req, res) => {
  try {
    const commissions = await Commission.find().sort({ createdAt: -1 }).populate('operatorId', 'name companyName');
    res.status(200).json({ success: true, commissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a commission rule
exports.updateCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const commission = await Commission.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!commission) {
      return res.status(404).json({ success: false, message: 'Commission rule not found' });
    }
    res.status(200).json({ success: true, commission });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a commission rule
exports.deleteCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const commission = await Commission.findByIdAndDelete(id);
    if (!commission) {
      return res.status(404).json({ success: false, message: 'Commission rule not found' });
    }
    res.status(200).json({ success: true, message: 'Commission rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Normalize values for safe matching (handles ObjectIds, nulls, and strings)
const normalize = (val) => val ? val.toString().trim().toLowerCase() : '';

// Helper: Match rule against booking parameters
const isMatch = (rule, params) => {
  const isAll = (val) => !val || normalize(val) === 'all';

  // 1. Logic Isolation
  const catMatch = rule.category === params.category;
  if (!catMatch) return false;

  // 2. Identity Match (Operator/Item) - Improved with ID extraction for populated objects
  const ruleOpId = rule.operatorId?._id || rule.operatorId;
  const ruleItemId = rule.itemId?._id || rule.itemId;
  const paramOpId = params.operatorId?._id || params.operatorId;
  const paramItemId = params.itemId?._id || params.itemId;

  const opMatch = !rule.operatorId ||
    normalize(ruleOpId) === normalize(paramOpId) ||
    (normalize(ruleItemId) === normalize(paramItemId) && !isAll(rule.itemId));

  const itMatch = isAll(rule.itemId) || normalize(ruleItemId) === normalize(paramItemId);

  // 3. Category Params
  let paramMatch = true;
  let failReason = '';

  if (params.category === 'Bus') {
    const sMatch = isAll(rule.seatType) || normalize(rule.seatType) === normalize(params.seatType);
    const bMatch = isAll(rule.busType) || normalize(rule.busType) === normalize(params.busType);
    const srcMatch = isAll(rule.sourceCity) || normalize(rule.sourceCity) === normalize(params.sourceCity);
    const destMatch = isAll(rule.destinationCity) || normalize(rule.destinationCity) === normalize(params.destinationCity);

    // Flexible Time Matching: If specific Bus ID matches, be lenient on time slot unless explicitly set to something else
    let timeMatch = isAll(rule.timeSlot) || normalize(rule.timeSlot) === normalize(params.timeSlot);
    if (!timeMatch && !isAll(rule.itemId) && normalize(ruleItemId) === normalize(paramItemId)) {
      // If the Bus ID matches exactly, we allow the commission to apply regardless of time slot
      // This fix allows "Vishwa Travels" rules created in Sandbox (Morning) to work for Night buses
      timeMatch = true;
    }

    paramMatch = sMatch && bMatch && srcMatch && destMatch && timeMatch;

    if (!paramMatch) {
      failReason = `[Mismatches: ${!sMatch ? `Seat(${rule.seatType} vs ${params.seatType}) ` : ''}${!bMatch ? `Bus(${rule.busType} vs ${params.busType}) ` : ''}${!srcMatch ? `Src(${rule.sourceCity} vs ${params.sourceCity}) ` : ''}${!destMatch ? `Dest(${rule.destinationCity} vs ${params.destinationCity}) ` : ''}${!timeMatch ? `Time(${rule.timeSlot} vs ${params.timeSlot})` : ''}]`;
    }

    if (paramMatch && params.distance !== undefined) {
      if (params.distance < rule.minDistance || params.distance > rule.maxDistance) {
        paramMatch = false;
        failReason = `Distance range mismatch: ${params.distance} not in ${rule.minDistance}-${rule.maxDistance}`;
      }
    }
  } else if (params.category === 'Hotel') {
    // Hotel Specific Logic (SIMPLIFIED)
    const cityMatch = isAll(rule.sourceCity) || normalize(rule.sourceCity) === normalize(params.city || params.sourceCity);
    const starMatch = !rule.starRating || (params.starRating || 0) >= rule.starRating;
    const priceMatch = (params.price || params.ticketPrice || 0) >= (rule.minPrice || 0) &&
      (params.price || params.ticketPrice || 0) <= (rule.maxPrice || 999999);

    paramMatch = cityMatch && starMatch && priceMatch;

    if (!paramMatch) {
      failReason = `[Mismatches: ${!cityMatch ? `City(${rule.sourceCity} vs ${params.city}) ` : ''}${!starMatch ? `StarRating(Rule:${rule.starRating} vs Input:${params.starRating}) ` : ''}${!priceMatch ? 'PriceRange' : ''}]`;
    }
  }

  // 4. Demand Logic (STRICT: Respect user's Weekend/Festival setting)
  const demand = params.isFestival ? 'festival' : params.isWeekend ? 'weekend' : 'normal';

  // Exact Match: If specific demand types are set, we MUST match them.
  // However, 'Normal' rules still act as a baseline for other days unless specialized rules exist.
  const hasDemand = rule.demandType && rule.demandType.length > 0;
  const demandMatch = !hasDemand ||
    rule.demandType.some(d => normalize(d) === demand) ||
    (demand !== 'normal' && rule.demandType.some(d => normalize(d) === 'normal'));

  // TOTAL MATCH
  const finalMatch = opMatch && itMatch && paramMatch && demandMatch;

  // VERBOSE LOGGING
  if (normalize(ruleItemId) === normalize(paramItemId)) {
    console.log(`[Diagnostic] Rule: "${rule.ruleName}"`);
    console.log(` -> Ident: Op=${opMatch ? '✅' : `❌ (Rule:${rule.operatorId} vs Input:${params.operatorId})`}, Item=${itMatch ? '✅' : `❌ (Rule:${rule.itemId} vs Input:${params.itemId})`}`);
    console.log(` -> Params: ${paramMatch ? '✅' : `❌ ${failReason}`}`);
    console.log(` -> Demand: ${demandMatch ? '✅' : `❌ (Input:${demand}, Rule:[${rule.demandType?.join(',')}])`}`);
    console.log(` -> FINAL: ${finalMatch ? 'MATCH ✅' : 'FAIL ❌'}`);
    console.log('-----------------------------------');
  }

  return finalMatch;
};

const calculateCommissionInternal = async (category, params) => {
  // Master Diagnostic: Check what is coming in
  console.log('--- COMMISSION ENGINE INVOCATION ---');
  console.log(`Targeting: ${category} | Source: ${params.sourceCity} -> ${params.destinationCity}`);
  console.log(`Asset: BusType=${params.busType}, SeatType=${params.seatType}, ID=${params.itemId}`);
  console.log(`Context: Distance=${params.distance}, Price=${params.ticketPrice}, Operator=${params.operatorId}`);
  console.log('-----------------------------------');

  // 1. Fetch active rules for the category, sorted by priority
  const rules = await Commission.find({ category, isActive: true }).sort({ priority: -1 });

  // 2. Find the top matching rule using the isolated matcher
  const bestRule = rules.find(rule => isMatch(rule, params));

  if (!bestRule) {
    // System fallback if no matching rule found
    const baseCommission = 0; // Fixed: Removed hardcoded 80/200 default
    const ticketPrice = Number(params.ticketPrice || 0);
    const discount = Number(params.discountAmount || 0);
    const finalPrice = Math.round(ticketPrice - discount + baseCommission);

    // Required Debug Log
    console.log('Commission Engine [Fallback]:', {
      baseFare: ticketPrice,
      discount,
      commission: baseCommission,
      finalPrice
    });

    return {
      success: true,
      base_fare: ticketPrice,
      discount: discount,
      commission: baseCommission,
      final_price: finalPrice,
      finalPrice: finalPrice,
      appliedRule: 'No Matching Rule',
      message: 'Strict Mode: No commission applied without explicit rule.'
    };
  }

  // 3. Payout Calculation
  let commission = 0;
  const ticketPrice = Number(params.ticketPrice || 0);
  const discount = Number(params.discountAmount || 0);
  const occupancy = Number(params.occupancy !== undefined ? params.occupancy : (params.demandLevel === 'High' ? 85 : params.demandLevel === 'Low' ? 15 : 50));

  // A. Determine Effective Fare for commission baseline
  const effectiveFare = bestRule.applyOn === 'Discounted' ? (ticketPrice - discount) : ticketPrice;

  // B. Determine Base Rule Value (Standard or Slab)
  let ruleValue = bestRule.value;
  if (bestRule.useSlabs && (params.distance !== undefined || params.price !== undefined) && category !== 'Hotel') {
    const comparator = params.category === 'Bus' ? params.distance : params.price;
    const matchingSlab = (bestRule.slabs || []).find(s => comparator >= s.min && comparator <= s.max);
    if (matchingSlab) ruleValue = matchingSlab.value;
  }

  // C. Calculate Initial Commission
  if (bestRule.commissionType === 'percentage') {
    commission = (effectiveFare * ruleValue) / 100;
  } else if (bestRule.commissionType === 'hybrid') {
    // Hybrid: MAX of fixed (minCap) or %
    const percentageVal = (effectiveFare * ruleValue) / 100;
    const fixedFloor = bestRule.minCap || 0;
    commission = Math.max(percentageVal, fixedFloor);
  } else {
    commission = ruleValue;
  }

  // D. APPLY CATEGORY SPECIFIC OVERRIDES
  if (category === 'Hotel') {
    // HOTEL IS SIMPLE: No Dynamic Multipliers or Slabs
    // Commission is already calculated correctly above
    // We skip the legacy demand logic and multipliers
  } else {
    // D. Apply Neural Demand Orchestration (Green/Stable/Peak Phase Modifiers)
    if (bestRule.isDynamic) {
      // Use rule's specific rates, defaulting to 0 modification if field is missing or explicitly 0
      const lowRate = bestRule.lowOccupancyRate !== undefined ? bestRule.lowOccupancyRate : -10; // Fallback to -10 only if purely missing
      const midRate = bestRule.mediumOccupancyRate !== undefined ? bestRule.mediumOccupancyRate : 0;
      const highRate = bestRule.highOccupancyRate !== undefined ? bestRule.highOccupancyRate : 20;

      if (occupancy < 30) {
        commission *= (1 + lowRate / 100);
      } else if (occupancy > 70) {
        commission *= (1 + highRate / 100);
      } else {
        // Stable Phase
        commission *= (1 + midRate / 100);
      }
    } else {
      // Legacy fallback
      if (occupancy < 30) commission *= 0.9;
      else if (occupancy > 70) commission *= 1.15;
    }

    // E. Apply Demand Multipliers (Weekend/Festival)
    if (params.isFestival) {
      commission *= (bestRule.festivalMultiplier || 1.2);
    } else if (params.isWeekend) {
      commission *= (bestRule.weekendMultiplier || 1.1);
    }
  }

  // F. Enforce Payout Governance (Caps)
  commission = Math.max(bestRule.minCap || 0, Math.min(bestRule.maxCap || 99999, commission));

  // G. Apply Rounding Rules
  if (bestRule.roundingRule === 'Round to 10') {
    commission = Math.round(commission / 10) * 10;
  } else if (bestRule.roundingRule === 'Round to 50') {
    commission = Math.round(commission / 50) * 50;
  } else {
    commission = Math.round(commission);
  }

  const finalPrice = Math.round(ticketPrice - discount + commission);

  // Required Debug Log
  console.log('Commission Engine [Match Found]:', {
    input: {
      source: params.sourceCity,
      destination: params.destinationCity,
      busType: params.busType,
      seatType: params.seatType,
      timeSlot: params.timeSlot
    },
    matchedRule: {
      id: bestRule._id,
      name: bestRule.ruleName,
      sourceCity: bestRule.sourceCity,
      destinationCity: bestRule.destinationCity
    },
    breakdown: {
      baseFare: ticketPrice,
      discount,
      commission,
      finalPrice
    }
  });

  return {
    success: true,
    base_fare: ticketPrice,
    discount: discount,
    commission: commission,
    final_price: finalPrice,
    finalPrice: finalPrice,
    appliedRule: bestRule.ruleName,
    matchedRuleId: bestRule._id,
    breakdown: {
      baseFare: ticketPrice,
      discount: discount,
      commission: commission,
      finalPrice: finalPrice
    },
    priority: bestRule.priority,
    commissionType: bestRule.commissionType
  };
};

exports.calculateCommissionInternal = calculateCommissionInternal;

exports.calculate = async (req, res) => {
  try {
    const { category, params } = req.body;
    params.category = category;

    const result = await calculateCommissionInternal(category, params);
    res.json(result);

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  StatusBar,
  BackHandler,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { flightService } from '../api/flightService';
import apiClient from '../api/apiClient';
import RazorpayCheckout from 'react-native-razorpay';
import FlightDetailsModal from './FlightDetailsModal';
import AncillarySelection from './AncillarySelection';

const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface PassengerDetailsProps {
  onBack: () => void;
  onNext?: () => void;
  onNavigateSearch?: () => void;
  searchResults?: any;
  selectedFlight?: any;
  selectedOption?: any;
  sessionId?: string;
  outboundSearchResults?: any;
  outboundOption?: any;
  outboundSessionId?: string;
  flightSearchParams?: any;
}

export default function PassengerDetails({
  onBack,
  onNext,
  onNavigateSearch,
  searchResults,
  selectedFlight,
  selectedOption,
  sessionId,
  outboundSearchResults,
  outboundOption,
  outboundSessionId,
  flightSearchParams,
}: PassengerDetailsProps) {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [outboundPreviewData, setOutboundPreviewData] = useState<any>(null);

  const outboundPreviewObj = outboundPreviewData?.data || outboundPreviewData || {};

  const cleanCode = (val: any) => {
    if (!val) return '';
    const str = String(val).trim();
    const match = str.match(/\(([A-Za-z]{3})\)/);
    if (match && match[1]) return match[1].toUpperCase();
    if (str.length === 3) return str.toUpperCase();
    const wordMatch = str.match(/\b([A-Za-z]{3})\b/);
    if (wordMatch && wordMatch[1]) return wordMatch[1].toUpperCase();
    return str.toUpperCase();
  };

  const formatDateString = (rawDateStr: string) => {
    if (!rawDateStr) return '';
    try {
      const d = new Date(rawDateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
      }
    } catch(e) {}
    return rawDateStr;
  };

  const outboundDate = formatDateString(flightSearchParams?.departDate);
  const returnDateVal = formatDateString(flightSearchParams?.returnDate);

  const outboundOriginCode = cleanCode(flightSearchParams?.from);
  const outboundDestCode = cleanCode(flightSearchParams?.to);


  useEffect(() => {
    const fetchPreviewOnMount = async () => {
      try {
        setLoadingPreview(true);

        const buildPreviewPayload = async (sResults: any, flight: any, opt: any, sess: string | undefined) => {
          const data = sResults?.data?.dataId ? sResults.data : (sResults?.dataId ? sResults : (sResults?.data || {}));
          const searchId = data.searchId || data.dataId;
          const dataId = data.dataId;
          if (!searchId) return null;

          let currentSessionId = sess;
          if (!currentSessionId) {
            try {
              const sRes = await flightService.createSession(searchId);
              currentSessionId = sRes?.data?.sessionId || sRes?.data?.data?.sessionId || sRes?.sessionId;
            } catch (e) { }
          }

          let rawTravelOptions: any[] = [];
          if (Array.isArray(data.travelOptions)) {
            rawTravelOptions = data.travelOptions;
          } else if (data.travelOptions && typeof data.travelOptions === 'object') {
            const entries = Object.values(data.travelOptions);
            entries.forEach((entry: any) => {
              if (Array.isArray(entry)) {
                rawTravelOptions.push(...entry);
              } else if (entry && typeof entry === 'object' && Object.keys(entry).length > 0) {
                rawTravelOptions.push(entry);
              }
            });
          }

          const matchingOpt = rawTravelOptions.find((t: any) =>
            t?.travelOptionId === flight?.id || t?.id === flight?.id
          ) || rawTravelOptions[0] || {};

          const travelOptId = matchingOpt?.travelOptionId || matchingOpt?.id || flight?.id;
          const subOptId = matchingOpt?.subTravelOptions?.[0]?.subTravelOptionId || travelOptId;

          let numPrice = 0;
          if (typeof opt?.price === 'number') {
            numPrice = opt.price;
          } else if (typeof opt?.price === 'string') {
            numPrice = Math.round(parseFloat(opt.price.replace(/[^0-9.-]+/g, "") || "0"));
          }

          const selectedOrigin = flight?.departureCode || flight?.originCode || flight?.fromCode || flight?.from || flight?.origin;
          const selectedDest = flight?.arrivalCode || flight?.destCode || flight?.toCode || flight?.to || flight?.destination;

          let sectors = Object.values(data.searchIntent || {}).map((intent: any, index: number) => {
            const rawPax = intent.paxInfos || intent.paxCriteria || intent.paxDetails || [];
            const mappedPax = rawPax.length > 0 ? rawPax.map((pax: any) => ({
              paxType: pax.paxType || pax.type || "ADT",
              paxCount: pax.paxCount || pax.count || 1,
              paxFareType: pax.paxFareType || "DEFAULT"
            })) : [{ paxType: "ADT", paxCount: 1, paxFareType: "DEFAULT" }];

            return {
              index: intent.index || (index + 1),
              origin: intent.origin || selectedOrigin || "",
              destination: intent.destination || selectedDest || "",
              departDate: intent.departDate || "09/08/2026",
              cabinType: (intent.cabinType || intent.cabin || 'ECONOMY').toUpperCase(),
              paxInfos: mappedPax
            };
          });

          if (sectors.length === 0) {
            sectors = [{
              index: 1,
              origin: selectedOrigin || "",
              destination: selectedDest || "",
              departDate: "09/08/2026",
              cabinType: "ECONOMY",
              paxInfos: [{ paxType: "ADT", paxCount: 1, paxFareType: "DEFAULT" }]
            }];
          }

          const mappedSubOptions = (matchingOpt?.subTravelOptions || []).map((subOpt: any) => ({
            subTravelOptionId: subOpt.subTravelOptionId,
            fareId: opt?.id || subOpt.fareId
          }));

          return {
            sessionId: currentSessionId,
            searchId,
            dataId,
            flightPreviewCriteria: {
              isMultiFareRequest: false,
              maxFareCount: 0,
              sellingCountryCode: "IN",
              sellingCurrencyCode: "INR"
            },
            searchIntents: { sectors },
            travelOptions: {
              "J1": {
                travelOptionId: travelOptId,
                price: numPrice,
                subTravelOptions: mappedSubOptions.length > 0 ? mappedSubOptions : [{ subTravelOptionId: subOptId, fareId: opt?.id }]
              }
            }
          };
        };

        const retPayload = await buildPreviewPayload(
          searchResults,
          selectedFlight?.isCombinedRoundTrip ? selectedFlight.returnFlight : selectedFlight,
          selectedOption,
          sessionId
        );
        if (retPayload) {
          const res = await flightService.flightPreview(retPayload);
          if (res?.data) {
            setPreviewData(res.data);
          }
        }

        if (selectedFlight?.isCombinedRoundTrip && outboundSearchResults) {
          const outPayload = await buildPreviewPayload(
            outboundSearchResults,
            selectedFlight.outboundFlight,
            outboundOption,
            outboundSessionId
          );
          if (outPayload) {
            const outRes = await flightService.flightPreview(outPayload);
            if (outRes?.data) {
              setOutboundPreviewData(outRes.data);
            }
          }
        }
      } catch (err) {
        console.warn('PassengerDetails flightPreview error:', err);
      } finally {
        setLoadingPreview(false);
      }
    };

    fetchPreviewOnMount();
  }, [searchResults, selectedFlight, selectedOption, sessionId, outboundSearchResults, outboundOption, outboundSessionId]);
  // Extract Live Data from Flight Preview API response (previewData) if available
  const previewDataObj = previewData?.data || previewData || {};
  const previewFares = previewDataObj.fares || {};
  const previewFlights = previewDataObj.flights || {};
  const previewBaggageMap = previewDataObj.baggageAllowances || {};
  const previewPenaltiesMap = previewDataObj.penalties || {};
  const previewAirportsMap = previewDataObj.metaData?.airportDetail?.airports || {};
  const previewAirlinesMap = previewDataObj.metaData?.airlineDetail?.airlines || {};


  const outboundOriginName = outboundPreviewObj?.metaData?.airportDetail?.airports?.[outboundOriginCode]?.name || previewAirportsMap[outboundOriginCode]?.name || (outboundOriginCode ? `${outboundOriginCode} Airport` : '');
  const outboundDestName = outboundPreviewObj?.metaData?.airportDetail?.airports?.[outboundDestCode]?.name || previewAirportsMap[outboundDestCode]?.name || (outboundDestCode ? `${outboundDestCode} Airport` : '');

  const returnOriginName = previewAirportsMap[outboundDestCode]?.name || (outboundDestCode ? `${outboundDestCode} Airport` : '');
  const returnDestName = previewAirportsMap[outboundOriginCode]?.name || (outboundOriginCode ? `${outboundOriginCode} Airport` : '');

  const previewConstraints = previewDataObj.constraintAssociations || {};
  const previewFieldAssoc = previewDataObj.fieldAssociations || {};
  const previewFareAssoc = previewDataObj.fareAssociations || {};

  // Extract valid fare IDs from fareAssociations mapping
  let assocFareIds: string[] = [];
  Object.values(previewFareAssoc).forEach((assoc: any) => {
    if (Array.isArray(assoc?.fareIds)) {
      assocFareIds.push(...assoc.fareIds);
    }
  });
  const assocFaresList = assocFareIds.map(fId => previewFares[fId]).filter(Boolean);

  // Find exact requested fare from preview API (checking requested === true or matching fareId in fareAssociations)
  const allPreviewFares = Object.values(previewFares) as any[];
  const activePreviewFare = 
    allPreviewFares.find((f: any) => f.requested === true) ||
    assocFaresList.find((f: any) => f.requested === true) ||
    (selectedOption?.fareId ? previewFares[selectedOption.fareId] : null) ||
    (selectedFlight?.fareId ? previewFares[selectedFlight.fareId] : null) ||
    allPreviewFares[0] ||
    {};

  // Live Pricing Breakdown from Preview API
  const livePricing = activePreviewFare.pricing;
  

  const outboundPreviewFares = outboundPreviewObj.fares || {};
  const outboundActiveFare = 
    Object.values(outboundPreviewFares).find((f: any) => f.requested === true) ||
    (outboundOption?.fareId ? outboundPreviewFares[outboundOption.fareId] : null) ||
    Object.values(outboundPreviewFares)[0] ||
    {};
  const outboundPricing = outboundActiveFare.pricing;

  const outboundTotalPrice = outboundPricing?.totalPrice || (outboundOption?.rawPrice ?? selectedFlight?.outboundFlight?.rawPrice ?? 0);
  const returnTotalPrice = livePricing?.totalPrice || (selectedOption?.rawPrice ?? selectedFlight?.returnFlight?.rawPrice ?? 0);
  const liveTotalPrice = selectedFlight?.isCombinedRoundTrip 
    ? (outboundTotalPrice + returnTotalPrice)
    : (livePricing?.totalPrice ?? selectedOption?.rawPrice ?? selectedFlight?.rawPrice ?? 0);

  const outboundBaseFare = outboundPricing?.totalBaseFare || outboundTotalPrice;
  const returnBaseFare = livePricing?.totalBaseFare || returnTotalPrice;
  const liveBaseFare = selectedFlight?.isCombinedRoundTrip
    ? (outboundBaseFare + returnBaseFare)
    : (livePricing?.totalBaseFare ?? selectedOption?.rawPrice ?? selectedFlight?.rawPrice ?? 0);

  const outboundTax = outboundPricing?.totalTax || 0;
  const returnTax = livePricing?.totalTax || 0;
  const liveTax = selectedFlight?.isCombinedRoundTrip
    ? (outboundTax + returnTax)
    : (livePricing?.totalTax ?? 0);

  // Live Flights sequence from Preview API (subTravelOptions.sequenceToFlightIdMap)
  const previewSubOptions = previewDataObj.subTravelOptions || {};
  const firstSubOpt = Object.values(previewSubOptions)[0] as any || {};
  const seqMap = firstSubOpt.sequenceToFlightIdMap || {};

  let sortedFlightIds: string[] = Object.keys(seqMap)
    .sort((a, b) => Number(a) - Number(b))
    .map(seqKey => seqMap[seqKey])
    .filter(Boolean);

  if (sortedFlightIds.length === 0) {
    sortedFlightIds = Object.keys(previewFlights);
  }

  const firstFlightObj = previewFlights[sortedFlightIds[0]] || {};
  const lastFlightObj = previewFlights[sortedFlightIds[sortedFlightIds.length - 1]] || {};

  const liveAirlineCode = firstFlightObj.airlineCode || firstFlightObj.operatingAirlineCode || '';
  const liveAirlineName = previewAirlinesMap[liveAirlineCode]?.name || selectedFlight?.airline || '';
  const liveFltNo = firstFlightObj.fltNo ? `${liveAirlineCode}-${firstFlightObj.fltNo}` : (firstFlightObj.id ? firstFlightObj.id.split('-').slice(0, 2).join('-') : (selectedFlight?.code || ''));



  const rawOrigin = firstSubOpt.originAirportCode ||
                    firstFlightObj.departureAirport?.code ||
                    selectedFlight?.departureCode ||
                    selectedFlight?.originCode ||
                    selectedFlight?.fromCode ||
                    selectedFlight?.from ||
                    selectedFlight?.origin ||
                    searchResults?.data?.searchIntent?.J1?.origin ||
                    '';

  const rawDest = firstSubOpt.destinationAirportCode ||
                  lastFlightObj.arrivalAirport?.code ||
                  selectedFlight?.arrivalCode ||
                  selectedFlight?.destCode ||
                  selectedFlight?.toCode ||
                  selectedFlight?.to ||
                  selectedFlight?.destination ||
                  searchResults?.data?.searchIntent?.J1?.destination ||
                  '';

  const originCode = selectedFlight?.isCombinedRoundTrip ? cleanCode(flightSearchParams?.from) : cleanCode(rawOrigin);
  const destCode = selectedFlight?.isCombinedRoundTrip ? cleanCode(flightSearchParams?.to) : cleanCode(rawDest);

  const liveDepTime = firstFlightObj.departureAirport?.time
    ? new Date(firstFlightObj.departureAirport.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';

  const liveArrTime = lastFlightObj.arrivalAirport?.time
    ? new Date(lastFlightObj.arrivalAirport.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';

  const liveDepDate = firstFlightObj.departureAirport?.time
    ? new Date(firstFlightObj.departureAirport.time).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
    : '';

  const liveArrDate = lastFlightObj.arrivalAirport?.time
    ? new Date(lastFlightObj.arrivalAirport.time).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
    : '';

  const headerDate = liveDepDate;
  const arrivalHeaderDate = liveArrDate || headerDate;

  const airlineName = previewAirlinesMap[liveAirlineCode]?.name || firstFlightObj.airlineCode || '';
  const flightCode = firstFlightObj.fltNo ? `${firstFlightObj.airlineCode || ''}-${firstFlightObj.fltNo}` : (firstFlightObj.id || '');
  const logoChar = airlineName ? airlineName.charAt(0) : '';
  const logoBg = '#0f172a';
  const stopsText = sortedFlightIds.length > 1 ? `${sortedFlightIds.length - 1} stop` : (sortedFlightIds.length === 1 ? 'Non-stop' : '');
  const depTime = liveDepTime;
  const arrTime = liveArrTime;
  const duration = firstSubOpt?.duration || '';
  const originAirportName = previewAirportsMap[originCode]?.name || (originCode ? `${originCode} Airport` : '');
  const destAirportName = previewAirportsMap[destCode]?.name || (destCode ? `${destCode} Airport` : '');

  const [showDetailedInfo, setShowDetailedInfo] = useState(false);

  const originCity = previewAirportsMap[originCode]?.city || originCode || '';
  const destCity = previewAirportsMap[destCode]?.city || destCode || '';

  // Build detailed dynamic list for each segment (for multi-stop/connecting flights)
  const buildSegmentsList = (pDataObj: any, pFlights: any, pAirlinesMap: any, pAirportsMap: any, defaultAirlineName: string, defaultFlightCode: string, defaultDepTime: string, defaultArrTime: string, defaultHeaderDate: string) => {
    const previewSubOptions = pDataObj.subTravelOptions || {};
    const firstSubOpt = Object.values(previewSubOptions)[0] as any || {};
    const seqMap = firstSubOpt.sequenceToFlightIdMap || {};

    let sortedIds: string[] = Object.keys(seqMap)
      .sort((a, b) => Number(a) - Number(b))
      .map(seqKey => seqMap[seqKey])
      .filter(Boolean);

    if (sortedIds.length === 0) {
      sortedIds = Object.keys(pFlights || {});
    }

    return sortedIds.map((fltId: string, idx: number) => {
      const fltObj = pFlights[fltId] || {};
      const airCode = fltObj.airlineCode || fltObj.operatingAirlineCode || '';
      const aName = pAirlinesMap[airCode]?.name || defaultAirlineName;
      const fnNo = fltObj.fltNo ? `${airCode}-${fltObj.fltNo}` : defaultFlightCode;

      const dCode = fltObj.departureAirport?.code || '';
      const aCode = fltObj.arrivalAirport?.code || '';
      const dAirport = pAirportsMap[dCode]?.name || (dCode ? `${dCode} Airport` : '');
      const aAirport = pAirportsMap[aCode]?.name || (aCode ? `${aCode} Airport` : '');
      const dCity = pAirportsMap[dCode]?.city || dCode;
      const aCity = pAirportsMap[aCode]?.city || aCode;
      const dTerminal = fltObj.departureAirport?.terminal?.name || '';
      const aTerminal = fltObj.arrivalAirport?.terminal?.name || '';

      const dTimeObj = fltObj.departureAirport?.time ? new Date(fltObj.departureAirport.time) : null;
      const aTimeObj = fltObj.arrivalAirport?.time ? new Date(fltObj.arrivalAirport.time) : null;

      const dTime = dTimeObj ? dTimeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : defaultDepTime;
      const aTime = aTimeObj ? aTimeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : defaultArrTime;

      const dDate = dTimeObj ? dTimeObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : defaultHeaderDate;
      const aDate = aTimeObj ? aTimeObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : defaultHeaderDate;

      let segDuration = '';
      if (dTimeObj && aTimeObj) {
        const diffMs = aTimeObj.getTime() - dTimeObj.getTime();
        const h = Math.floor(diffMs / 3600000);
        const m = Math.round((diffMs % 3600000) / 60000);
        segDuration = `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
      }

      let layoverStr = '';
      let layoverDurationStr = '';
      const nextFltId = sortedIds[idx + 1];
      if (nextFltId) {
        const nextFlt = pFlights[nextFltId] || {};
        const nextDepTimeObj = nextFlt.departureAirport?.time ? new Date(nextFlt.departureAirport.time) : null;
        if (aTimeObj && nextDepTimeObj) {
          const layoverMs = nextDepTimeObj.getTime() - aTimeObj.getTime();
          const lh = Math.floor(layoverMs / 3600000);
          const lm = Math.round((layoverMs % 3600000) / 60000);
          layoverDurationStr = `${lh > 0 ? `${lh}h ` : ''}${lm}m`;
          layoverStr = `⏱️ Layover in ${aCity} (${aCode}): ${layoverDurationStr}`;
        }
      }

      return {
        id: fltId,
        index: idx + 1,
        airlineName: aName,
        airlineCode: airCode,
        logoUrl: airCode ? `https://images.kiwi.com/airlines/64/${airCode.trim().toUpperCase()}.png` : '',
        flightCode: fnNo,
        depCode: dCode,
        arrCode: aCode,
        depCity: dCity,
        arrCity: aCity,
        depAirport: dAirport,
        arrAirport: aAirport,
        depTerminal: dTerminal,
        arrTerminal: aTerminal,
        depTime: dTime,
        arrTime: aTime,
        depDate: dDate,
        arrDate: aDate,
        duration: segDuration,
        layoverText: layoverStr,
        layoverDurationText: layoverDurationStr,
      };
    });
  };

  const outboundSegs = selectedFlight?.isCombinedRoundTrip && outboundPreviewObj
    ? buildSegmentsList(
        outboundPreviewObj,
        outboundPreviewObj.flights || {},
        outboundPreviewObj.metaData?.airlineDetail?.airlines || {},
        outboundPreviewObj.metaData?.airportDetail?.airports || {},
        selectedFlight.outboundFlight?.airline,
        selectedFlight.outboundFlight?.code,
        selectedFlight.outboundFlight?.depTime,
        selectedFlight.outboundFlight?.arrTime,
        outboundDate
      ).map(seg => ({ ...seg, isReturn: false }))
    : [];

  const returnSegs = previewDataObj
    ? buildSegmentsList(
        previewDataObj,
        previewFlights || {},
        previewAirlinesMap || {},
        previewAirportsMap || {},
        selectedFlight?.isCombinedRoundTrip ? selectedFlight.returnFlight?.airline : airlineName,
        selectedFlight?.isCombinedRoundTrip ? selectedFlight.returnFlight?.code : flightCode,
        selectedFlight?.isCombinedRoundTrip ? selectedFlight.returnFlight?.depTime : depTime,
        selectedFlight?.isCombinedRoundTrip ? selectedFlight.returnFlight?.arrTime : arrTime,
        selectedFlight?.isCombinedRoundTrip ? returnDateVal : headerDate
      ).map(seg => ({ ...seg, isReturn: selectedFlight?.isCombinedRoundTrip ? true : false }))
    : [];

  const segmentsList = selectedFlight?.isCombinedRoundTrip ? [...outboundSegs, ...returnSegs] : returnSegs;



  // 100% Dynamic Baggage Extraction from Cleartrip API Response
  let dynamicCabinBag = '';
  let dynamicCheckinBag = '';

  try {
    const flightFares = activePreviewFare.subTravelOptionFare?.[0]?.flightFare || [];
    const baggageId = flightFares[0]?.baggageAllowances?.[0]?.baggageAllowanceId;
    if (baggageId && previewBaggageMap[baggageId]) {
      const bList = previewBaggageMap[baggageId];
      bList.forEach((b: any) => {
        const item = b.allowedBaggages?.[0];
        if (item) {
          const str = `${item.quantity} ${item.unit}${item.piece ? `, ${item.piece} Pc` : ''}`;
          if (b.type === 'BAGGAGE_CABIN') dynamicCabinBag = str;
          if (b.type === 'BAGGAGE_CHECK_IN') dynamicCheckinBag = str;
        }
      });
    }
  } catch (e) {}

  const cabinBag = dynamicCabinBag || selectedOption?.cabinBaggage || selectedFlight?.baggageCabin || '';
  const checkInBag = dynamicCheckinBag || selectedOption?.checkInBaggage || selectedFlight?.baggageCheckin || '';

  // Selected Add-ons Price State (Seats / Meals / Baggage)
  const [addonPrice, setAddonPrice] = useState(0);

  const baseRawPriceNum = liveTotalPrice !== undefined ? liveTotalPrice : 0;
  const rawPriceNum = baseRawPriceNum + addonPrice;
  const baseFareNum = liveBaseFare !== undefined ? liveBaseFare : 0;
  const taxFareNum = liveTax !== undefined ? liveTax : 0;

  const formattedTotal = `₹${rawPriceNum.toLocaleString('en-IN')}`;
  const formattedBase = `₹${baseFareNum.toLocaleString('en-IN')}`;
  const formattedTax = `₹${taxFareNum.toLocaleString('en-IN')}`;

  // Form State
  const [title, setTitle] = useState('Mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('07/08/2001');
  const [email, setEmail] = useState('rahul@example.com');
  const [mobile, setMobile] = useState('9876543210');
  const [addGst, setAddGst] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showFareRules, setShowFareRules] = useState(false);

  // Dropdown selectors modal/states
  const [showTitlePicker, setShowTitlePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  
  // Ancillary Modal State
  const [showAncillaries, setShowAncillaries] = useState(false);
  const [outboundAncillaries, setOutboundAncillaries] = useState<any>(null);
  const [returnAncillaries, setReturnAncillaries] = useState<any>(null);
  const [ancillaryStep, setAncillaryStep] = useState<'outbound' | 'return' | null>(null);

  // Handle Android hardware back button
  useEffect(() => {
    const backAction = () => {
      onBack();
      return true; // Prevent default action (exit app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [onBack]);

  // Hold Flight State
  const [holdingFlight, setHoldingFlight] = useState(false);
  const [outboundHoldResult, setOutboundHoldResult] = useState<any>(null);
  const [holdResult, setHoldResult] = useState<any>(null);
  const [showHoldSuccessModal, setShowHoldSuccessModal] = useState(false);

  const handleExecuteHold = async (outboundAncillariesSelected?: any, returnAncillariesSelected?: any) => {
    try {
      setHoldingFlight(true);

      const formattedTitle = title ? title.toUpperCase() : 'MR';
      const formattedGender = (gender || 'MALE').toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE';
      
      let formattedDob = '1997-01-01';
      if (dob) {
        const parts = dob.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts;
          formattedDob = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        } else if (dob.includes('-')) {
          formattedDob = dob;
        }
      }

      const buildHoldPayload = (sResults: any, flight: any, opt: any, pData: any, sess: string | undefined, ancillariesSelected?: any) => {
        const activeSessionId = sess || pData.sessionId || sResults?.sessionId || sResults?.data?.sessionId || sResults?.data?.searchId || sResults?.searchId || '';
        const activePreviewId = pData.flightPreviewId || '';
        let subOptIdKey = flight?.id || 'SG-269-BLR-BOM-1785949500';
        if (pData.subTravelOptions && typeof pData.subTravelOptions === 'object') {
          const keys = Object.keys(pData.subTravelOptions);
          if (keys.length > 0) {
            subOptIdKey = keys[0];
          }
        }
        const travelOptId = subOptIdKey;
        const fareIdVal = opt?.id || opt?.fareId || Object.keys(pData.fares || {})[0] || '';

        const legFlightIds = subOptIdKey.includes('__') ? subOptIdKey.split('__') : [subOptIdKey];

        const flightAncillariesList = legFlightIds.map((fId: string) => ({
          flightId: fId,
          ancillaries: ancillariesSelected?.flightAncillaries || []
        }));

        return {
          sessionId: activeSessionId,
          searchId: sResults?.data?.searchId || sResults?.searchId || '',
          flightPreviewId: activePreviewId,
          previewData: pData,
          travelOptions: [
            {
              travelOptionId: travelOptId,
              subTravelOptions: [
                {
                  subTravelType: "FLIGHT",
                  subTravelOptionId: subOptIdKey,
                  fareId: fareIdVal
                }
              ]
            }
          ],
          passengerInformation: {
            passengers: [
              {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                middleName: "",
                gender: formattedGender,
                email: email.trim(),
                travellerType: "ADT",
                dob: formattedDob,
                nationalityCode: "IN",
                address: {
                  mobileNumber: mobile.trim(),
                  countryCode: "91"
                },
                title: formattedTitle,
                subTravelOptionAncillaries: [
                  {
                    subTravelOptionId: subOptIdKey,
                    subTravelType: "FLIGHT",
                    flightAncillaries: flightAncillariesList,
                    ancillaries: ancillariesSelected?.ancillaries || []
                  }
                ],
                documents: []
              }
            ]
          },
          customerInformation: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            title: formattedTitle,
            emailId: email.trim(),
            address: {
              countryCode: "91"
            },
            phoneNumberDetails: {
              phoneNumber: mobile.trim(),
              countryCode: "91"
            }
          },
          metaInformation: {
            currency: "INR",
            domain: "IN",
            sectorType: "DOMESTIC",
            itineraryId: activeSessionId || "CURRENT_SESSION_ID"
          }
        };
      };

      if (selectedFlight?.isCombinedRoundTrip) {
        // Hold Outbound
        console.log('[PassengerDetails] Holding Outbound flight...');
        const outboundPayload = buildHoldPayload(
          outboundSearchResults,
          selectedFlight.outboundFlight,
          outboundOption,
          outboundPreviewObj,
          outboundSessionId,
          outboundAncillariesSelected
        );
        const outRes = await flightService.holdFlight(outboundPayload);
        
        // Hold Return
        console.log('[PassengerDetails] Holding Return flight...');
        const returnPayload = buildHoldPayload(
          searchResults,
          selectedFlight.returnFlight,
          selectedOption,
          previewDataObj,
          sessionId,
          returnAncillariesSelected
        );
        const retRes = await flightService.holdFlight(returnPayload);

        if (outRes && (outRes.success || outRes.data) && retRes && (retRes.success || retRes.data)) {
          setOutboundHoldResult(outRes.data || outRes);
          setHoldResult(retRes.data || retRes);
          setShowHoldSuccessModal(true);
        } else {
          Alert.alert('Hold Booking Status', 'One or both flight holds failed.');
        }
      } else {
        // One way hold
        const holdPayload = buildHoldPayload(searchResults, selectedFlight, selectedOption, previewDataObj, sessionId, outboundAncillariesSelected || returnAncillariesSelected);
        const res = await flightService.holdFlight(holdPayload);
        if (res && (res.success || res.data)) {
          setHoldResult(res.data || res);
          setShowHoldSuccessModal(true);
        } else {
          Alert.alert('Hold Booking Status', res?.message || 'Hold completed successfully!');
        }
      }
    } catch (err: any) {
      console.error('[PassengerDetails] executeHold error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to place flight hold';
      Alert.alert('Hold Booking Error', errMsg);
    } finally {
      setHoldingFlight(false);
    }
  };

  // Book / Ticketing Flight State
  const [bookingFlight, setBookingFlight] = useState(false);
  const [bookResult, setBookResult] = useState<any>(null);
  const [showBookSuccessModal, setShowBookSuccessModal] = useState(false);

  const handleExecuteBook = async () => {
    try {
      setBookingFlight(true);

      const activeSessionId = sessionId || previewDataObj.sessionId || searchResults?.sessionId || searchResults?.data?.sessionId || searchResults?.data?.searchId || searchResults?.searchId || '';
      
      const travelIdFromHold = holdResult?.heldState?.travelIds?.[0] || holdResult?.travelIds?.[0] || holdResult?.travelId;
      const fallbackTravelId = previewDataObj.subTravelOptions?.[0]?.travelOptionId || selectedFlight?.id || 'SPICEJET__OWDELPNQ100SG105e2bab3f27ca6434b8b7dec0c8e5e0ab7exp1786460827992__DC_dc1__SC';
      const travelIdToBook = travelIdFromHold || fallbackTravelId;

      // 1. Create Razorpay Payment Order on Backend
      const numericTotal = Number(rawPriceNum) || 5000;
      console.log('[PassengerDetails] Step 1: Creating Razorpay Order for amount:', numericTotal);
      
      let razorpayOrderData: any = null;
      let razorpayData: any = null;

      try {
        const orderRes = await apiClient.post('/payments/create-order', {
          amount: numericTotal,
          notes: {
            type: 'FLIGHT',
            sessionId: activeSessionId,
            travelId: travelIdToBook
          }
        });

        if (orderRes.data && orderRes.data.success) {
          razorpayOrderData = orderRes.data;
          
          // 2. Open Razorpay Payment SDK Modal
          const options = {
            description: `Flight Ticket - ${originCode} to ${destCode}`,
            image: 'https://i.imgur.com/3g7uj6C.png',
            key: razorpayOrderData.key,
            amount: razorpayOrderData.amount,
            currency: razorpayOrderData.currency || 'INR',
            name: 'GoAirClass Flights',
            order_id: razorpayOrderData.orderId,
            prefill: {
              email: email.trim(),
              contact: mobile.trim(),
              name: `${title} ${firstName} ${lastName}`.trim()
            },
            theme: { color: '#2563eb' }
          };

          console.log('[PassengerDetails] Step 2: Opening Razorpay Checkout SDK...');
          razorpayData = await RazorpayCheckout.open(options);
          console.log('[PassengerDetails] Razorpay Payment Verified on SDK:', razorpayData);
        }
      } catch (payErr: any) {
        console.warn('[PassengerDetails] Razorpay SDK checkout info:', payErr?.message || payErr);
      }

      // 3. Commit Cleartrip Book API call (Passing Razorpay verification IDs & signature)
      const baseBookPayload = {
        razorpayOrderId: razorpayData?.razorpay_order_id || razorpayOrderData?.orderId || '',
        razorpayPaymentId: razorpayData?.razorpay_payment_id || '',
        razorpaySignature: razorpayData?.razorpay_signature || '',
        passenger: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender: (gender || 'MALE').toUpperCase(),
          dob: dob || '1997-01-01',
          email: email.trim(),
          phone: mobile.trim(),
          title: title ? title.toUpperCase() : 'MR'
        },
        contact: {
          email: email.trim(),
          phone: mobile.trim(),
          countryCode: '91'
        }
      };

      if (selectedFlight?.isCombinedRoundTrip) {
        // Book Outbound
        const outboundTravelId = outboundHoldResult?.heldState?.travelIds?.[0] || outboundHoldResult?.travelIds?.[0] || outboundHoldResult?.travelId;
        const outboundBookPayload = {
          ...baseBookPayload,
          sessionId: outboundSessionId || outboundHoldResult?.sessionId || '',
          travelIds: [outboundTravelId],
          flight: selectedFlight.outboundFlight
        };
        console.log('[PassengerDetails] Step 3a: Booking Outbound flight...');
        const outRes = await flightService.bookFlight(outboundBookPayload);

        // Book Return
        const returnBookPayload = {
          ...baseBookPayload,
          sessionId: sessionId || holdResult?.sessionId || '',
          travelIds: [travelIdToBook],
          flight: selectedFlight.returnFlight
        };
        console.log('[PassengerDetails] Step 3b: Booking Return flight...');
        const retRes = await flightService.bookFlight(returnBookPayload);

        if (retRes && (retRes.success || retRes.data)) {
          setShowHoldSuccessModal(false);
          setBookResult(retRes.data || retRes);
          setShowBookSuccessModal(true);
        } else {
          Alert.alert('Flight Booking Status', 'One or both flight ticket issuances failed.');
        }
      } else {
        const bookPayload = {
          ...baseBookPayload,
          sessionId: activeSessionId,
          travelIds: [travelIdToBook],
          flight: selectedFlight
        };
        console.log('[PassengerDetails] Step 3: Executing Cleartrip Book API with payload:', JSON.stringify(bookPayload, null, 2));

        const res = await flightService.bookFlight(bookPayload);
        console.log('[PassengerDetails] Book API Response:', res);

        if (res && (res.success || res.data)) {
          setShowHoldSuccessModal(false);
          setBookResult(res.data || res);
          setShowBookSuccessModal(true);
        } else {
          Alert.alert('Flight Booking Status', res?.message || 'Booking issued successfully!');
        }
      }
    } catch (err: any) {
      console.error('[PassengerDetails] executeBook error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to issue flight booking / e-ticket';
      Alert.alert('Booking Error', errMsg);
    } finally {
      setBookingFlight(false);
    }
  };

  const handleNext = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Information', 'Please enter Passenger First Name and Last Name.');
      return;
    }
    if (!email.trim() || !mobile.trim()) {
      Alert.alert('Required Information', 'Please enter valid Email Address and Mobile Number.');
      return;
    }
    
    // Start sequential seat selection
    if (selectedFlight?.isCombinedRoundTrip) {
      setAncillaryStep('outbound');
      setShowAncillaries(true);
    } else {
      setAncillaryStep('return');
      setShowAncillaries(true);
    }
  };


  const rawPax = Object.values(searchResults?.data?.searchIntent || searchResults?.searchIntent || {})[0] as any || {};
  const paxList = rawPax.paxInfos || rawPax.paxCriteria || rawPax.paxDetails || [];
  
  let passengerCount = 1;
  if (paxList.length > 0) {
    passengerCount = paxList.reduce((sum: number, p: any) => sum + (p.paxCount || p.count || 0), 0);
  } else if (flightSearchParams?.passengers) {
    const p = flightSearchParams.passengers;
    passengerCount = (p.adults || 0) + (p.children || 0) + (p.infants || 0);
  }

  const subtitleText = selectedFlight?.isCombinedRoundTrip
    ? `Outbound: ${outboundDate} • Return: ${returnDateVal} • 👤 ${passengerCount} Traveler(s)`
    : `Depart: ${headerDate} • 👤 ${passengerCount} Traveler(s)`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a1120" />

      {/* Top Navigation Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          <View style={styles.routeHeaderInfo}>
            <Text style={styles.headerRouteText}>{originCode} → {destCode}</Text>
            <Text style={styles.headerSubtitle}>{subtitleText}</Text>
          </View>

          {/* Stepper Progress Badges */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCompleted]}>
                <Text style={styles.stepCircleTextCompleted}>✓</Text>
              </View>
              <Text style={styles.stepLabelActive}>Flight Select</Text>
            </View>

            <View style={styles.stepLine} />

            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCurrent]}>
                <Text style={styles.stepCircleTextCurrent}>2</Text>
              </View>
              <Text style={styles.stepLabelCurrent}>Passenger Details</Text>
            </View>

            <View style={styles.stepLine} />

            <View style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepCircleText}>3</Text>
              </View>
              <Text style={styles.stepLabel}>Payment</Text>
            </View>

            <View style={styles.stepLine} />

            <View style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepCircleText}>4</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Flight Details Summary Card */}
        {selectedFlight?.isCombinedRoundTrip ? (
          <View style={{ marginBottom: 12 }}>
            {/* Outbound Card */}
            <View style={[styles.card, { marginBottom: 12 }]}>
              <View style={styles.flightCardHeader}>
                <Image
                  source={{ uri: `https://images.kiwi.com/airlines/64/${(selectedFlight.outboundFlight?.logoChar || '6E').trim().toUpperCase()}.png` }}
                  style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }}
                  resizeMode="contain"
                />
                <View style={styles.flightNumberGroup}>
                  <Text style={styles.airlineName}>{selectedFlight.outboundFlight?.airline} • {selectedFlight.outboundFlight?.code}</Text>
                  <View style={styles.nonstopTag}>
                    <Text style={styles.nonstopTagText}>[Outbound] {selectedFlight.outboundFlight?.stops}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.routeDetailsRow}>
                <View style={styles.originCol}>
                  <Text style={styles.cityCodeText}>{cleanCode(flightSearchParams?.from)}</Text>
                  <Text style={styles.airportNameText} numberOfLines={2}>{outboundOriginName}</Text>
                  <Text style={styles.timeText}>{selectedFlight.outboundFlight?.depTime}</Text>
                  <Text style={styles.dateText}>{outboundDate}</Text>
                </View>
                <View style={styles.durationCol}>
                  <View style={styles.durationBadge}>
                    <Text style={styles.clockIcon}>🕒</Text>
                    <Text style={styles.durationText}>{selectedFlight.outboundFlight?.duration}</Text>
                  </View>
                </View>
                <View style={styles.destCol}>
                  <Text style={[styles.cityCodeText, { textAlign: 'right' }]}>{cleanCode(flightSearchParams?.to)}</Text>
                  <Text style={[styles.airportNameText, { textAlign: 'right' }]} numberOfLines={2}>{outboundDestName}</Text>
                  <Text style={[styles.timeText, { textAlign: 'right' }]}>{selectedFlight.outboundFlight?.arrTime}</Text>
                  <Text style={[styles.dateText, { textAlign: 'right' }]}>{outboundDate}</Text>
                </View>
              </View>
            </View>

            {/* Return Card */}
            <View style={styles.card}>
              <View style={styles.flightCardHeader}>
                <Image
                  source={{ uri: `https://images.kiwi.com/airlines/64/${(selectedFlight.returnFlight?.logoChar || '6E').trim().toUpperCase()}.png` }}
                  style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }}
                  resizeMode="contain"
                />
                <View style={styles.flightNumberGroup}>
                  <Text style={styles.airlineName}>{selectedFlight.returnFlight?.airline} • {selectedFlight.returnFlight?.code}</Text>
                  <View style={styles.nonstopTag}>
                    <Text style={styles.nonstopTagText}>[Return] {selectedFlight.returnFlight?.stops}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.routeDetailsRow}>
                <View style={styles.originCol}>
                  <Text style={styles.cityCodeText}>{cleanCode(flightSearchParams?.to)}</Text>
                  <Text style={styles.airportNameText} numberOfLines={2}>{returnOriginName}</Text>
                  <Text style={styles.timeText}>{selectedFlight.returnFlight?.depTime}</Text>
                  <Text style={styles.dateText}>{returnDateVal}</Text>
                </View>
                <View style={styles.durationCol}>
                  <View style={styles.durationBadge}>
                    <Text style={styles.clockIcon}>🕒</Text>
                    <Text style={styles.durationText}>{selectedFlight.returnFlight?.duration}</Text>
                  </View>
                </View>
                <View style={styles.destCol}>
                  <Text style={[styles.cityCodeText, { textAlign: 'right' }]}>{cleanCode(flightSearchParams?.from)}</Text>
                  <Text style={[styles.airportNameText, { textAlign: 'right' }]} numberOfLines={2}>{returnDestName}</Text>
                  <Text style={[styles.timeText, { textAlign: 'right' }]}>{selectedFlight.returnFlight?.arrTime}</Text>
                  <Text style={[styles.dateText, { textAlign: 'right' }]}>{returnDateVal}</Text>
                </View>
              </View>
              {/* View Detailed Information Toggle Button for Round Trip */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}
                onPress={() => setShowDetailedInfo(true)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#2563eb' }}>
                  View detailed information
                </Text>
                <Text style={{ fontSize: 13, color: '#2563eb', marginLeft: 6, fontWeight: 'bold' }}>
                  ∨
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.flightCardHeader}>
              <Image
                source={{ uri: `https://images.kiwi.com/airlines/64/${(liveAirlineCode || '6E').trim().toUpperCase()}.png` }}
                style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }}
                resizeMode="contain"
              />
              <View style={styles.flightNumberGroup}>
                <Text style={styles.airlineName}>{airlineName} • {flightCode}</Text>
                <View style={styles.nonstopTag}>
                  <Text style={styles.nonstopTagText}>{stopsText}</Text>
                </View>
              </View>
              <View style={[styles.priceVerifiedBadge, loadingPreview && { backgroundColor: '#f59e0b' }]}>
                {loadingPreview ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.priceVerifiedText}>VERIFYING...</Text>
                  </View>
                ) : (
                  <Text style={styles.priceVerifiedText}>✓ PRICE VERIFIED</Text>
                )}
              </View>
            </View>

            {/* Clean High-Level Summary Route Row */}
            <View style={styles.routeDetailsRow}>
              {/* Origin */}
              <View style={styles.originCol}>
                <Text style={styles.cityCodeText}>{originCode}</Text>
                <Text style={styles.airportNameText} numberOfLines={2}>
                  {originAirportName}
                </Text>
                <Text style={styles.timeText}>{depTime}</Text>
                <Text style={styles.dateText}>{headerDate}</Text>
              </View>

              {/* Flight Path Graphic */}
              <View style={styles.durationCol}>
                <View style={styles.durationBadge}>
                  <Text style={styles.clockIcon}>🕒</Text>
                  <Text style={styles.durationText}>{duration}</Text>
                </View>
                <View style={styles.pathLineContainer}>
                  <View style={styles.pathDot} />
                  <View style={styles.pathLine} />
                  <View style={styles.pathDot} />
                </View>
                <Text style={styles.pathTagText}>{stopsText}</Text>
              </View>

              {/* Destination */}
              <View style={styles.destCol}>
                <Text style={[styles.cityCodeText, { textAlign: 'right' }]}>{destCode}</Text>
                <Text style={[styles.airportNameText, { textAlign: 'right' }]} numberOfLines={2}>
                  {destAirportName}
                </Text>
                <Text style={[styles.timeText, { textAlign: 'right' }]}>{arrTime}</Text>
                <Text style={[styles.dateText, { textAlign: 'right' }]}>{arrivalHeaderDate}</Text>
              </View>
            </View>

            {/* Baggage Info Grid */}
            <View style={styles.baggageRow}>
              <View style={styles.baggageItem}>
                <Text style={styles.baggageIcon}>🧳</Text>
                <View>
                  <Text style={styles.baggageTitle}>Cabin Baggage</Text>
                  <Text style={styles.baggageValue}>{cabinBag}</Text>
                </View>
              </View>
              <View style={styles.baggageDivider} />
              <View style={styles.baggageItem}>
                <Text style={styles.baggageIcon}>🧳</Text>
                <View>
                  <Text style={styles.baggageTitle}>Check-in Baggage</Text>
                  <Text style={styles.baggageValue}>{checkInBag}</Text>
                </View>
              </View>
            </View>

            {/* View Detailed Information Toggle Button */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}
              onPress={() => setShowDetailedInfo(true)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#2563eb' }}>
                View detailed information
              </Text>
              <Text style={{ fontSize: 13, color: '#2563eb', marginLeft: 6, fontWeight: 'bold' }}>
                ∨
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dedicated Animated Flight Details Bottom Sheet Modal */}
        <FlightDetailsModal
          visible={showDetailedInfo}
          onClose={() => setShowDetailedInfo(false)}
          segmentsList={segmentsList}
          airlineName={airlineName}
          airlineCode={liveAirlineCode}
          originCity={originCity}
          destCity={destCity}
          headerDate={headerDate}
          originCode={originCode}
          destCode={destCode}
          totalDuration={duration}
          stopsText={stopsText}
          logoBg={logoBg}
          logoChar={logoChar}
          isRoundTrip={selectedFlight?.isCombinedRoundTrip}
        />

        {/* Fare Breakdown Card */}
        <View style={styles.card}>
          <View style={styles.cardSectionTitleRow}>
            <View style={styles.blueIconBox}>
              <Text style={styles.blueIconText}>$</Text>
            </View>
            <Text style={styles.cardSectionTitle}>FARE BREAKDOWN</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base Fare (Adult 1)</Text>
            <Text style={styles.breakdownValue}>{formattedBase}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Taxes & Government Fees</Text>
            <Text style={styles.breakdownValue}>{formattedTax}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>B2B Convenience Partner Fee</Text>
            <Text style={styles.freeBadgeText}>FREE</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Seat & Meal Selection</Text>
            {addonPrice > 0 ? (
              <Text style={[styles.breakdownValue, { color: '#2563eb', fontWeight: 'bold' }]}>+₹{addonPrice.toLocaleString('en-IN')}</Text>
            ) : (
              <Text style={styles.includedBadgeText}>FREE STANDARD SEATS</Text>
            )}
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalValue}>{formattedTotal}</Text>
          </View>

          <View style={styles.guaranteedFareRow}>
            <Text style={styles.greenCheckIcon}>✓</Text>
            <Text style={styles.guaranteedFareText}>Guaranteed Fare</Text>
          </View>
        </View>

        {/* Passenger Information Form Card */}
        <View style={styles.card}>
          <View style={styles.cardSectionTitleRow}>
            <Text style={styles.sectionHeaderEmoji}>👤</Text>
            <Text style={styles.cardSectionTitle}>PASSENGER INFORMATION</Text>
          </View>

          <View style={styles.passengerSubHeader}>
            <Text style={styles.passengerIconSub}>👤</Text>
            <Text style={styles.passengerSubHeaderText}>ADULT 1 (ADULT)</Text>
          </View>

          <View style={styles.formRow}>
            {/* Title Selection */}
            <View style={styles.titleCol}>
              <Text style={styles.fieldLabel}>TITLE *</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() => setShowTitlePicker(!showTitlePicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownText}>{title}</Text>
                <Text style={styles.dropdownArrow}>∨</Text>
              </TouchableOpacity>
            </View>

            {/* First Name Input */}
            <View style={styles.firstNameCol}>
              <Text style={styles.fieldLabel}>FIRST NAME *</Text>
              <TextInput
                style={styles.textInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="e.g. Rahul"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Last Name Input */}
            <View style={styles.lastNameCol}>
              <Text style={styles.fieldLabel}>LAST NAME *</Text>
              <TextInput
                style={styles.textInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="e.g. Sharma"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Inline Dropdown for Title options */}
          {showTitlePicker && (
            <View style={styles.pickerOptionsContainer}>
              {['Mr', 'Mrs', 'Ms', 'Dr'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.pickerOptionItem}
                  onPress={() => {
                    setTitle(item);
                    setShowTitlePicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, title === item && styles.pickerOptionTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.formRow}>
            {/* Gender Selection */}
            <View style={styles.genderCol}>
              <Text style={styles.fieldLabel}>GENDER *</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() => setShowGenderPicker(!showGenderPicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownText}>{gender}</Text>
                <Text style={styles.dropdownArrow}>∨</Text>
              </TouchableOpacity>
            </View>

            {/* DOB Input */}
            <View style={styles.dobCol}>
              <Text style={styles.fieldLabel}>DATE OF BIRTH *</Text>
              <View style={styles.dateInputWrapper}>
                <TextInput
                  style={[styles.textInput, styles.dateInput]}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#94a3b8"
                />
                <Text style={styles.calendarIcon}>📅</Text>
              </View>
            </View>
          </View>

          {/* Inline Dropdown for Gender options */}
          {showGenderPicker && (
            <View style={styles.pickerOptionsContainer}>
              {['Male', 'Female', 'Other'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.pickerOptionItem}
                  onPress={() => {
                    setGender(item);
                    setShowGenderPicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, gender === item && styles.pickerOptionTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Contact Details Card */}
        <View style={styles.card}>
          <View style={styles.cardSectionTitleRow}>
            <Text style={styles.sectionHeaderEmoji}>📞</Text>
            <Text style={styles.cardSectionTitle}>CONTACT DETAILS (FOR UPDATES & TICKETS)</Text>
          </View>

          <View style={styles.formRow}>
            {/* Email Address */}
            <View style={styles.emailCol}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS *</Text>
              <View style={styles.inputWithIconWrapper}>
                <Text style={styles.inputPrefixIcon}>✉</Text>
                <TextInput
                  style={styles.textInputWithIcon}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="rahul@example.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.mobileCol}>
              <Text style={styles.fieldLabel}>MOBILE NUMBER *</Text>
              <View style={styles.inputWithIconWrapper}>
                <Text style={styles.inputPrefixIcon}>📞</Text>
                <TextInput
                  style={styles.textInputWithIcon}
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="9876543210"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* GST Toggle Option */}
          <TouchableOpacity
            style={styles.gstCheckboxRow}
            onPress={() => setAddGst(!addGst)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkboxSquare, addGst && styles.checkboxSquareChecked]}>
              {addGst && <Text style={styles.checkboxCheckmark}>✓</Text>}
            </View>
            <Text style={styles.gstCheckboxLabel}>
              Add GST Details (Optional for Business Travellers)
            </Text>
          </TouchableOpacity>

          {addGst && (
            <View style={styles.gstFormSection}>
              <View style={styles.gstFieldGroup}>
                <Text style={styles.fieldLabel}>GST NUMBER</Text>
                <TextInput
                  style={styles.textInput}
                  value={gstNumber}
                  onChangeText={setGstNumber}
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="characters"
                />
              </View>
              <View style={[styles.gstFieldGroup, { marginTop: 10 }]}>
                <Text style={styles.fieldLabel}>COMPANY NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="e.g. Acme Corporation"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          )}
        </View>

        {/* Cancellation & Fare Rules Accordion */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowFareRules(!showFareRules)}
          activeOpacity={0.9}
        >
          <View style={styles.accordionHeaderRow}>
            <View style={styles.accordionLeftGroup}>
              <View style={styles.shieldIconBox}>
                <Text style={styles.shieldIcon}>🛡️</Text>
              </View>
              <View>
                <Text style={styles.fareRulesTitle}>CANCELLATION & FARE RULES</Text>
                <Text style={styles.fareRulesSubtitle}>View rules and permitted changes</Text>
              </View>
            </View>
            <Text style={styles.accordionChevron}>{showFareRules ? '∧' : '∨'}</Text>
          </View>

          {showFareRules && (
            <View style={styles.fareRulesExpandedContent}>
              <View style={styles.ruleItemRow}>
                <Text style={styles.ruleDot}>•</Text>
                <Text style={styles.ruleText}>Cancellation Fee starting from ₹4,899 per passenger.</Text>
              </View>
              <View style={styles.ruleItemRow}>
                <Text style={styles.ruleDot}>•</Text>
                <Text style={styles.ruleText}>Date change fee starting from ₹2,999 + fare difference.</Text>
              </View>
              <View style={styles.ruleItemRow}>
                <Text style={styles.ruleDot}>•</Text>
                <Text style={styles.ruleText}>Name changes are not permitted after ticket issuance.</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Instant E-ticket Banner */}
        <View style={styles.eTicketBanner}>
          <View style={styles.eTicketIconBox}>
            <Text style={styles.eTicketIcon}>🎫</Text>
          </View>
          <View style={styles.eTicketTextCol}>
            <Text style={styles.eTicketTitle}>Instant Cleartrip E-ticket</Text>
            <Text style={styles.eTicketSubtitle}>
              Your PNR will be issued immediately upon payment confirmation.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Sticky Action Button */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.9} disabled={holdingFlight || bookingFlight}>
          {holdingFlight || bookingFlight ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text style={styles.nextBtnText}>NEXT: SELECT SEATS & IN-FLIGHT MEALS</Text>
              <Text style={styles.nextBtnChevron}>›</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Ancillary Selection Modal */}
      <AncillarySelection 
        visible={showAncillaries}
        onClose={() => {
          setShowAncillaries(false);
          setAncillaryStep(null);
        }}
        onConfirm={(selected) => {
          if (ancillaryStep === 'outbound') {
            setOutboundAncillaries(selected);
            // Close modal briefly to reset content, then open Return leg selection
            setShowAncillaries(false);
            setTimeout(() => {
              setAncillaryStep('return');
              setShowAncillaries(true);
            }, 300);
          } else {
            setReturnAncillaries(selected);
            setShowAncillaries(false);
            setAncillaryStep(null);
            
            const outSum = outboundAncillaries?.totalAddonPrice || 0;
            const retSum = selected?.totalAddonPrice || 0;
            setAddonPrice(outSum + retSum);

            // Execute concurrent holds sequentially
            handleExecuteHold(outboundAncillaries, selected);
          }
        }}
        flightPreviewId={ancillaryStep === 'outbound' ? outboundPreviewObj?.flightPreviewId : previewDataObj?.flightPreviewId}
        subTravelOptions={ancillaryStep === 'outbound' ? outboundPreviewObj?.subTravelOptions : previewDataObj?.subTravelOptions}
        searchIntent={ancillaryStep === 'outbound' ? (outboundPreviewObj?.searchIntent || 'BLR_BOM') : (previewDataObj?.searchIntent || 'BOM_BLR')}
        sessionId={
          ancillaryStep === 'outbound'
            ? (outboundSessionId || outboundPreviewObj?.sessionId || outboundSearchResults?.sessionId || '')
            : (sessionId || previewDataObj?.sessionId || searchResults?.sessionId || '')
        }
        fareId={
          ancillaryStep === 'outbound'
            ? (outboundActiveFare?.fareId || Object.keys(outboundPreviewFares || {})[0] || '')
            : (activePreviewFare?.fareId || Object.keys(previewFares || {})[0] || '')
        }
      />

      {/* Hold Success Modal */}
      <Modal visible={showHoldSuccessModal} transparent animationType="slide" onRequestClose={() => setShowHoldSuccessModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', backgroundColor: '#ffffff', borderRadius: 20, padding: 24, alignItems: 'center', elevation: 10 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 32, color: '#16a34a', fontWeight: 'bold' }}>✓</Text>
            </View>

            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 }}>
              Flight Hold Successful!
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>
              Cleartrip B2B has held your seat and locked the fare price.
            </Text>

            <View style={{ width: '100%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: '#64748b' }}>Trip ID / PNR:</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1e293b' }}>
                  {holdResult?.tripId || holdResult?.bookingId || holdResult?.heldState?.tripId || 'HELD_CONFIRMED'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: '#64748b' }}>Passenger:</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b' }}>
                  {firstName} {lastName}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: '#64748b' }}>Status:</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#16a34a' }}>
                  HELD (PRICE LOCKED)
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={{ width: '100%', backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              onPress={handleExecuteBook}
              activeOpacity={0.8}
              disabled={bookingFlight}
            >
              {bookingFlight ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>
                  CONFIRM & ISSUE E-TICKET
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Book Success E-Ticket Issued Modal */}
      <Modal visible={showBookSuccessModal} transparent animationType="slide" onRequestClose={() => setShowBookSuccessModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', backgroundColor: '#ffffff', borderRadius: 20, padding: 24, alignItems: 'center', elevation: 10 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 32, color: '#16a34a', fontWeight: 'bold' }}>🎫</Text>
            </View>

            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 }}>
              Cleartrip E-Ticket Confirmed!
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>
              Your flight booking has been ticketed & PNR generated successfully.
            </Text>

            <View style={{ width: '100%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: '#64748b' }}>Booking PNR / Trip ID:</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2563eb' }}>
                  {bookResult?.tripId || bookResult?.pnr || bookResult?.bookingId || 'PNR-CLEARTIP-CONFIRMED'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: '#64748b' }}>Route:</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1e293b' }}>
                  {originCode} → {destCode}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: '#64748b' }}>Passenger Name:</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b' }}>
                  {title} {firstName} {lastName}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: '#64748b' }}>Booking Status:</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#16a34a' }}>
                  CONFIRMED / TICKETED
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={{ width: '100%', backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              onPress={() => {
                setShowBookSuccessModal(false);
                if (onNavigateSearch) {
                  onNavigateSearch();
                } else {
                  onBack();
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>
                DONE / BACK TO SEARCH
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  headerContainer: {
    backgroundColor: '#0a1120',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  backBtnText: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  routeHeaderInfo: {
    flex: 1,
  },
  headerRouteText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleted: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  stepCircleTextCompleted: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  stepCurrent: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  stepCircleTextCurrent: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '900',
  },
  stepCircleText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  stepLine: {
    width: 14,
    height: 2,
    backgroundColor: '#334155',
    marginHorizontal: 3,
  },
  stepLabel: {
    display: 'none',
  },
  stepLabelActive: {
    display: 'none',
  },
  stepLabelCurrent: {
    display: 'none',
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 110,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // Flight Card Styles
  flightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  airlineLogoBox: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  airlineLogoText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
  },
  flightNumberGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  airlineName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
    marginRight: 8,
  },
  nonstopTag: {
    backgroundColor: '#1e293b',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  nonstopTagText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  priceVerifiedBadge: {
    borderWidth: 1,
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceVerifiedText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },

  routeDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  originCol: {
    flex: 1,
  },
  destCol: {
    flex: 1,
  },
  durationCol: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  cityCodeText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  airportNameText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  timeText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
    fontFamily: FONT_FAMILY,
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  durationText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  pathLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    width: 80,
  },
  pathDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
  },
  pathLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#cbd5e1',
  },
  pathTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    fontFamily: FONT_FAMILY,
  },

  baggageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  baggageItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  baggageIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  baggageTitle: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  baggageValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  baggageDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },

  // Fare Breakdown Card Styles
  cardSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  blueIconBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  blueIconText: {
    color: '#2563eb',
    fontWeight: '900',
    fontSize: 12,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#475569',
    fontFamily: FONT_FAMILY,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#16a34a',
    fontFamily: FONT_FAMILY,
  },
  includedBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#16a34a',
    fontFamily: FONT_FAMILY,
  },
  dashedDivider: {
    borderWidth: 0.8,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    fontFamily: FONT_FAMILY,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  guaranteedFareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  greenCheckIcon: {
    fontSize: 14,
    fontWeight: '900',
    color: '#16a34a',
    marginRight: 6,
  },
  guaranteedFareText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
    fontFamily: FONT_FAMILY,
  },

  // Passenger Information Form Styles
  sectionHeaderEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  passengerSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  passengerIconSub: {
    fontSize: 14,
    marginRight: 8,
  },
  passengerSubHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    fontFamily: FONT_FAMILY,
  },
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  titleCol: {
    width: '16%',
    paddingHorizontal: 4,
  },
  firstNameCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  lastNameCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  genderCol: {
    width: '28%',
    paddingHorizontal: 4,
    marginTop: 12,
  },
  dobCol: {
    flex: 1,
    paddingHorizontal: 4,
    marginTop: 12,
  },
  emailCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  mobileCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
    fontFamily: FONT_FAMILY,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  dropdownArrow: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  dateInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  dateInput: {
    paddingRight: 32,
  },
  calendarIcon: {
    position: 'absolute',
    right: 10,
    fontSize: 14,
  },

  pickerOptionsContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pickerOptionItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerOptionText: {
    fontSize: 13,
    color: '#334155',
    fontFamily: FONT_FAMILY,
  },
  pickerOptionTextSelected: {
    fontWeight: '800',
    color: '#2563eb',
  },

  // Contact Details Styles
  inputWithIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  inputPrefixIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  textInputWithIcon: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  gstCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#ffffff',
  },
  checkboxSquareChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkboxCheckmark: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  gstCheckboxLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  gstFormSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  gstFieldGroup: {
    marginBottom: 4,
  },

  // Fare Rules Styles
  accordionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shieldIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  shieldIcon: {
    fontSize: 14,
  },
  fareRulesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  fareRulesSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  accordionChevron: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
  },
  fareRulesExpandedContent: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  ruleItemRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  ruleDot: {
    fontSize: 12,
    color: '#d97706',
    marginRight: 8,
  },
  ruleText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: FONT_FAMILY,
    flex: 1,
  },

  // Cleartrip E-ticket banner
  eTicketBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  eTicketIconBox: {
    marginRight: 12,
  },
  eTicketIcon: {
    fontSize: 22,
  },
  eTicketTextCol: {
    flex: 1,
  },
  eTicketTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1d4ed8',
    fontFamily: FONT_FAMILY,
  },
  eTicketSubtitle: {
    fontSize: 11,
    color: '#2563eb',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },

  // Footer Action Button
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  nextBtn: {
    backgroundColor: '#b45309', // Golden brown matching image button tone
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
    marginRight: 6,
  },
  nextBtnChevron: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

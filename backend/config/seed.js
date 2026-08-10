const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Fixed admin accounts for this project.
// Login flow: email + password (checked here) -> OTP emailed to the same address -> verify.
const ADMIN_ACCOUNTS = [
    {
        role: "superadmin",
        fullName: "Suraj Kurrey",
        email: "rdhayatidak@gmail.com",
        password: "Rutuja@2004",
        mobileNumber: "9999900001", // placeholder — required unique field, unused for admin login
    },
    {
        role: "admin",
        fullName: "Adil",
        email: "itsmedhayatidak@gmail.com",
        password: "Dhayatidak@2004",
        mobileNumber: "999990005    ", // placeholder — required unique field, unused for admin login
    },
];

const seedSuperAdmin = async () => {
    for (const account of ADMIN_ACCOUNTS) {
        try {
            const hashedPassword = await bcrypt.hash(account.password, 10);
            let user = await User.findOne({ email: account.email });

            if (!user) {
                user = await User.create({
                    fullName: account.fullName,
                    mobileNumber: account.mobileNumber,
                    email: account.email,
                    isEmailVerified: true,
                    role: account.role,
                    adminUsername: account.email,
                    adminPassword: hashedPassword,
                });
                console.log(` ✅ ${account.role} created:`, account.email);
            } else {
                user.role = account.role;
                user.fullName = account.fullName;
                user.isEmailVerified = true;
                user.adminUsername = account.email;
                user.adminPassword = hashedPassword;
                await user.save();
                console.log(` ✅ ${account.role} synced:`, account.email);
            }
        } catch (error) {
            console.error(` ❌ Error seeding ${account.role} (${account.email}):`, error.message);
        }
    }
};

module.exports = seedSuperAdmin;

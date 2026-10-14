const validateCollegeEmail = (email) => {
    if (!email) {
        return {
            valid: false,
            message: "Email is required"
        };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
        return {
            valid: false,
            message: "Invalid email format"
        };
    }

    // College domain validation
    // Add valid college domains here (e.g., "gec.ac.in", ".edu"). 
    // "gmail.com" is included temporarily to make local development and testing easier.
    const allowedDomains = ["ac.in", "edu", "edu.in", "gmail.com"]; 
    const domain = normalizedEmail.split('@')[1];

    const isCollegeDomain = allowedDomains.some((allowedDomain) => 
        domain.endsWith(allowedDomain)
    );

    if (!isCollegeDomain) {
        return {
            valid: false,
            message: "Please use a valid college email address (.edu or .ac.in)"
        };
    }

    return {
        valid: true,
        email: normalizedEmail
    };
};

module.exports = validateCollegeEmail;

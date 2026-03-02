window.SITE_CONFIG = Object.assign({}, window.SITE_CONFIG, {
  analytics: {
    // GA4 measurement ID for the website.
    // For Germany/EU, only switch this on once your consent flow is in place.
    ga4MeasurementId: "G-W8V7DJS054",

    // Set to true temporarily while testing events in GA4 DebugView.
    debug: false,

    // Hostnames that should fire the dedicated partner-click event.
    blueRiverHostnames: ["www.blueriver-canyoning.de", "blueriver-canyoning.de"]
  }
});

# Javascript client for Domoio
This library let you receive notifications from Domoio, and change port states easily.

    var Domoio = require('domoio');

    const email = "user@somedomain.com";
    const password = "ultrasecret";
    const project_id = "ea739c8c-f82b-4e13-88ec-83ead4dd6014";

    // Register a port change listener
    Domoio.on('port_changed', (body) => {
      let {device_id, port_id, value} = body;

      // Turn off the device sendind 0
      if (value) {
        setTimeout(() => Domoio.setPort(device_id, "in", 0), 1000);
      }
    });

    // Connect to Domoio
    Domoio.start({email, password, project_id});

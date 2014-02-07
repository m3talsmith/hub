var when = require('when');

var skynet = require('skynet');

var subdevices = require('./subdevices');


function connect(gatewayId, token){
  console.log('connecting...');
  var defer = when.defer();


  var conn = skynet.createConnection({
    uuid: gatewayId,
    token: token,
    protocol: "mqtt",
    qos: 0 // MQTT Quality of Service (0=no confirmation, 1=confirmation, 2=not supported)
  });


  conn.on('notReady', function(data){
    console.log('UUID FAILED AUTHENTICATION!', data);
    defer.reject(data);
  });

  conn.on('ready', function(data){
    defer.resolve(conn);
    console.log('UUID AUTHENTICATED!', data);

    conn.on('message', function(channel, message){
      console.log('message received channel=', channel, ' message=', message);
      if(channel == gatewayId){
        console.log('message for gate, call subdevices');
        try{
          if(typeof message == "string"){
            message = JSON.parse(message);
          }
          //console.log('looking for subdevice',message.subdevices, 'in', subdevices.instances );
          var instance = subdevices.instances[message.subdevices];

          if(instance){
            //console.log('matching subdevice found!', instance);
            instance.onMessage(message);
          }

        }catch(exp){
          console.log('err dispatching message', exp);
        }
      }

    });

    // conn.message({
    //     "devices": "0d3a53a0-2a0b-11e3-b09c-ff4de847b2cc",
    //     "message": {
    //       "skynet":"wassup gateway online"
    //     }
    //   });

    // Event triggered when device loses connection to skynet
    conn.on('disconnect', function(data){
      console.log('disconnected from skynet');
    });



    // WhoAmI?
    // conn.whoami({uuid:gatewayId}, function (data) {
    //   console.log('whoami', data);
    // });


    // Skynet status
    // conn.status(function (data) {
    //   console.log('status', data);
    // });



  });

  return defer.promise;


}

module.exports = connect;
var stompClient = null;

var vm = new Vue({
	el: '#main-content',
	data: {
	    TicketRequestDisabled: true,
	    TicketCollectedDisabled : true,
	    VehicleEnteredDisabled: true,
	    BarrierOpen: false
    }
})

function initialize() {
	vm.TicketRequestDisabled = true;
	vm.TicketCollectedDisabled = true;
	vm.VehicleEnteredDisabled = true;
	BarrierOpen = false;
}

function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#disconnect").prop("disabled", !connected);
    if (connected) {
        $("#conversation").show();
    }
    else {
        $("#conversation").hide();
        initialize();
    }
    $("#replies").html("");
}

// When connecting, subscribe to a location-specific topic to receive
// messages sent from the server.
function connect() {
    var socket = new SockJS('/Carpark-websocket');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        setConnected(true);
        console.log('Connected: ' + frame);
        stompClient.subscribe('/topic/EntryStand/' + $("#location").val(), function (reply) {
            showReply(JSON.parse(reply.body).content);
        });
    });
}

function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    setConnected(false);
    console.log("Disconnected");
}

// Client-to-server messages.
function sendToServer( messageName ) {
    stompClient.send("/app/" + messageName, {}, JSON.stringify({'location': $("#location").val()}));
}

// Display a message received from the server and 
// update the enable/disable states of buttons based on the 
// the incoming message.
function showReply(message) {
    $("#replies").append("<tr><td>" + message + "</td></tr>");
    if ( message == "Ticket request enabled" ) {
    	vm.TicketRequestDisabled = false;
    } else if ( message == "Open barrier" ) {
    	vm.VehicleEnteredDisabled = false;
    	vm.TicketCollectedDisabled = true;
    	vm.BarrierOpen = true;
    } else if ( message.includes( "Issue ticket"  )) {
    	vm.TicketRequestDisabled = true;
    	vm.TicketCollectedDisabled = false;
    } else if ( message == "Close barrier" ) {
    	vm.VehicleEnteredDisabled = true;
    	vm.BarrierOpen = false;
    }
}

// Map buttons to functions.
$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    $( "#connect" ).click(function() { connect(); });
    $( "#disconnect" ).click(function() { disconnect(); });
    $( "#VehicleWaiting" ).click(function() { sendToServer( "VehicleWaiting" ); });
    $( "#TicketRequest" ).click(function() { sendToServer( "TicketRequested" ); });
    $( "#TicketCollected" ).click(function() { sendToServer( "TicketCollected" ); });
    $( "#VehicleEntered" ).click(function() { sendToServer( "VehicleEntered" ); });
});
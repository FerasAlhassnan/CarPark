var stompClient = null;

var vm = new Vue({
	el: '#main-content',
	data: {
	    DateTime: "",
	    Capacity: "",
	    Occupancy: "",
	    Availability: "",
	    NorthEntry: false,
	    NorthTicket: "",
	    NorthBarrier: "",
	    NorthDelayedEntry: false,
	    Lane1Exit: false,
	    Lane1Ticket: "",
	    Lane1ExitDeadline: "",
	    Lane1Barrier: "",
	    Lane1TicketNumber: "",
	    Lane1AdditionalCharge: "",
	    Lane1Overstay: "",
	    Lane1Charge: "",
	    Lane1Duration: "",
	    Lane1TardyExit: false,
	    Lane1UnpaidStayExit: false
    }
})

function initialize() {
	vm.DateTime = "";
	vm.Capacity = "";
	vm.Occupancy = "";
	vm.Availability = "";
	vm.NorthEntry = false;
	vm.Lane1Exit = false;
	vm.NorthDelayedEntry = false;
    vm.Lane1TardyExit = false;
    vm.Lane1UnpaidStayExit = false;
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
        stompClient.subscribe('/topic/OperatorConsole', function (reply) {
            handleReply(reply);
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
function sendToServer( messageName, paramName, paramValue ) {
	var messageBody = {};
	messageBody[paramName] = paramValue;
    stompClient.send("/app/" + messageName, {}, JSON.stringify( messageBody ));
}

// Display a message received from the server and
// update data as necessary.
function handleReply(reply) {
    $("#replies").append("<tr><td>" + JSON.stringify( JSON.parse( reply.body ) ) + "</td></tr>");
    var messageName = JSON.parse( reply.body ).messageName;
    if ( messageName == "ActivateEntryStand" ) {
    	vm.NorthBarrier = JSON.parse( reply.body ).barrier;
    	vm.NorthTicket = JSON.parse( reply.body ).ticket;
    	vm.NorthEntry = true;
    } else if ( messageName == "ActivateExitStand" ) {
    	vm.Lane1Ticket = JSON.parse( reply.body ).ticket;
    	vm.Lane1Barrier = JSON.parse( reply.body ).barrier;
    	vm.Lane1ExitDeadline = JSON.parse( reply.body ).exitDeadline;
        vm.Lane1Exit = true;
    } else if ( messageName == "DeactivateEntryStand" ) {
    	vm.NorthEntry = false;
    	vm.NorthDelayedEntry = false;
    } else if ( messageName == "DeactivateExitStand" ) {
    	vm.Lane1Exit = false;
    	vm.Lane1TardyExit = false;
    	vm.Lane1UnpaidStayExit = false;
    } else if ( messageName == "DelayedEntry" ) {
    	vm.NorthDelayedEntry = true;
    } else if ( messageName == "OccupancyUpdate" ) {
    	vm.Occupancy = JSON.parse( reply.body ).occupancy;
    	vm.Capacity = JSON.parse( reply.body ).capacity;
    	vm.Availability = JSON.parse( reply.body ).availability;
    } else if ( messageName == "TardyExit" ) {
    	vm.Lane1TicketNumber = JSON.parse( reply.body ).ticketNumber;
    	vm.Lane1AdditionalCharge = Number( JSON.parse( reply.body ).additionalCharge ).toFixed(2);
    	vm.Lane1Overstay = Number( JSON.parse( reply.body ).overstay ).toFixed(2);
    	vm.Lane1TardyExit = true;
    } else if ( messageName == "UnpaidStayExit" ) {
    	vm.Lane1TicketNumber = JSON.parse( reply.body ).ticketNumber;
    	vm.Lane1Charge = Number( JSON.parse( reply.body ).charge ).toFixed(2);
    	vm.Lane1Duration = Number( JSON.parse( reply.body ).duration ).toFixed(2);
    	vm.Lane1UnpaidStayExit = true;
    } else if ( messageName == "DateTimeUpdate" ) {
    	vm.DateTime = JSON.parse( reply.body ).dateTime;
    }
}

// Map buttons to functions.
$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    $( "#connect" ).click(function() { connect(); });
    $( "#disconnect" ).click(function() { disconnect(); });
    $( "#NorthIssueTicket" ).click(function() { sendToServer( "OperatorIssueTicket", "location", "North" ); });
    $( "#NorthOpenBarrier" ).click(function() { sendToServer( "OpenEntryBarrier", "location", "North" ); });
    $( "#Lane1OpenBarrier" ).click(function() { sendToServer( "OpenExitBarrier", "location", "Lane 1" ); });
    $( "#Lane1TardyCancel" ).click(function() { sendToServer( "FeeWaived", "ticketNumber", vm.Lane1TicketNumber ); });
    $( "#Lane1TardyPaid" ).click(function() { sendToServer( "FeeCollected", "ticketNumber", vm.Lane1TicketNumber ); });
    $( "#Lane1UnpaidCancel" ).click(function() { sendToServer( "FeeWaived", "ticketNumber", vm.Lane1TicketNumber ); });
    $( "#Lane1UnpaidPaid" ).click(function() { sendToServer( "FeeCollected", "ticketNumber", vm.Lane1TicketNumber ); });
});
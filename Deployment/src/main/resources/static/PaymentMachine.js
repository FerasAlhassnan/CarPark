var stompClient = null;

var vm = new Vue({
	el: '#main-content',
	data: {
	    InsertedTicketDisabled: false,
	    InsertedCurrencyDisabled: true,
	    TicketCollectedDisabled : true,
	    WaivedChangeDisabled: true,
	    CancelledTransactionDisabled: true,
	    RemainingBalance: "",
	    InsufficientChange: false,
	    ExitDeadline: "",
	    ChangeDispensed: ""
    }
})

function initialize() {
    vm.InsertedTicketDisabled = false;
    vm.InsertedCurrencyDisabled = true;
    vm.TicketCollectedDisabled = true;
    vm.WaivedChangeDisabled = true;
    vm.CancelledTransactionDisabled = true;
    vm.RemainingBalance = "";
    vm.InsufficientChange = false;
    vm.ExitDeadline = "";
    vm.ChangeDispensed = "";
}

function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#disconnect").prop("disabled", !connected);
    if (connected) {
        $("#conversation").show();
    }
    else {
        $("#conversation").hide();
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
        stompClient.subscribe('/topic/PaymentMachine/' + $("#location").val(), function (reply) {
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
function sendInsertedTicket() {
    stompClient.send("/app/PMInsertedTicket", {}, 
      JSON.stringify({'location': $("#location").val(), 'ticketNumber': $("#TicketNumber").val()}));
    vm.CancelledTransactionDisabled = false;
    vm.InsertedTicketDisabled = true;
}

function sendInsertedCurrency( amount ) {
    stompClient.send("/app/InsertedCurrency", {}, 
      JSON.stringify({'location': $("#location").val(), 'amount': amount}));
    vm.InsertedCurrencyDisabled = true;
}

function sendToServer( messageName ) {
    stompClient.send("/app/" + messageName, {}, JSON.stringify({'location': $("#location").val()}));
    if ( messageName == "PMTicketCollected" )
    	initialize();
}

// Display a message received from the server,
// update the enable/disable states of buttons
// and the remaining balance based on the 
// the incoming message.
function showReply(message) {
    $("#replies").append("<tr><td>" + message + "</td></tr>");
    if ( message.includes( "Exit deadline" ) ) {
    	vm.ExitDeadline = message;
    } else if ( message == "InsufficientChange" ) {
        vm.InsufficientChange = true;
    	vm.WaivedChangeDisabled = false;
    	vm.InsertedCurrencyDisabled = true;
    } else if ( message.includes( "Remaining balance"  )) {
    	vm.InsertedCurrencyDisabled = false;
        vm.CancelledTransactionDisabled = false;
        var balanceIndex = message.indexOf( ": " ) + 2;
        vm.RemainingBalance = "Remaining balance: " + (Number( message.slice( balanceIndex ) ).toFixed(2)).toString();
    } else if ( message == "ReturnedTicket" ) {
    	vm.TicketCollectedDisabled = false;
    	vm.CancelledTransactionDisabled = true;
    	vm.InsertedCurrencyDisabled = true;
    	vm.WaivedChangeDisabled = true;
    	vm.InsufficientChange = false;
    } else if ( message.includes( "Dispense change" ) ) {
    	var changeIndex = message.indexOf( ": " ) + 2;
    	vm.ChangeDispensed = "Change dispensed: " + (Number( message.slice( changeIndex ) ).toFixed(2)).toString();
    }
}

// Map buttons to functions.
$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    $( "#connect" ).click(function() { connect(); });
    $( "#disconnect" ).click(function() { disconnect(); });
    $( "#InsertedTicket" ).click(function() { sendInsertedTicket(); });
    $( "#InsertedCurrency1" ).click(function() { sendInsertedCurrency( "1" ); });
    $( "#InsertedCurrency2" ).click(function() { sendInsertedCurrency( "2" ); });
    $( "#InsertedCurrency5" ).click(function() { sendInsertedCurrency( "5" ); });
    $( "#InsertedCurrency10" ).click(function() { sendInsertedCurrency( "10" ); });
    $( "#InsertedCurrency20" ).click(function() { sendInsertedCurrency( "20" ); });
    $( "#CancelledTransaction" ).click(function() { sendToServer( "CancelledTransaction" ); });
    $( "#WaivedChange" ).click(function() { sendToServer( "WaivedChange" ); });
    $( "#TicketCollected" ).click(function() { sendToServer( "PMTicketCollected" ); });
});
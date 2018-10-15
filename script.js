function winlosetie(us, them) {
    var iUs = parseInt(us);
    var iThem = parseInt(them);
    return (iUs > iThem) ? 'win' : ((iUs < iThem) ? 'lose' : 'tie');
}

function isWhiteSpace(chr) {
  return (" \t\r\n\v\f".indexOf(chr) >= 0);
}
function isDigit(chr) {
  return (chr >= '0' && chr <= '9');
}
function isAlpha(chr) {
  return ((chr >= 'a' && chr <= 'z') || (chr >= 'A' && chr <= 'Z'));
}
function SmallCaps(instr) {
  var outstr = "";
  var i = 0;
  var looking = true;
  var chr = instr.charAt(i);
  while (chr) {
    i++;
    if (looking) {
      if (!isAlpha(chr) || isWhiteSpace(chr)) {
        outstr += chr;
      } else {
        looking = false;
        outstr += chr;
        outstr += "<span>";
      }
    } else {
      if (  isWhiteSpace(chr)) {
        outstr += "</span>";
        outstr += chr;
        looking = true;
      } else {
        outstr += chr.toUpperCase();
      }
    }
    chr = instr.charAt(i);
  }
  if (!looking)
    outstr += "</span>";
  return outstr;
}

function GetCleanURL() {
  return window.location.protocol + "//" + window.location.hostname + window.location.pathname;
}

function DisplayTeamList() {
  // Replace existing list with empty one
  var teamlistobj = $('ul.teamlist');
  // Sort teams by reverse years
  teamlist.sort(function(a, b) {
    return b.Year - a.Year;
  });
  // Populate with items from the team list, setting the link to the current URL
  // plus the teamid
  var year = 0;
  $.each(teamlist, function(index, value) {
    if (value.Year != year) {
      year = value.Year;
      $("<li style='text-align: center; text-decoration: underline'>" + year.toString() + "</li>")
      .appendTo(teamlistobj);
    }
    var team = $('<li/>')
               .appendTo(teamlistobj);
    if (value.TeamSpreadsheet)
      $("<a href='" + GetCleanURL() + "?teamid=" + value.USAVCode + "'/>")
        .html(value.TeamName)
        .appendTo(team);
    else
      $(value.TeamName)
        .appendTo(team);
  });
}

function DisplayPage(tab, page) {
  $(".activetab").removeClass('activetab');
  $(tab).addClass('activetab');
  $('.page').addClass('gone');
  $(page).removeClass('gone');
  $('.overall').removeClass('gone');
}

var currentdataarray;
var currenttabletop;
var foetable;
var tourneytable;
var playertable;

// Display the list of teams in a clickable list
function FillKnownPages(dataarray, tabletop) {
  // Start by getting the list of teams from the team spreadsheet
  teamlist = dataarray[TEAMSHEETSHEET].elements;
  // Decorate the team names for desired display (either in list or in masthead)
  $.each(teamlist, function(index, value) {
    teamlist[index].TeamName = "<div class='teambanner' style='" + "color:" + value.Color + "'>" + SmallCaps(value.TeamName) + "</div>";
  });

  // If the URL contains no teamid, then set up the selection list
  if (!urlParams.teamid) {
    DisplayTeamList();
  // Otherwise, if the teamid matches one of the ones in the team list,
  // use the accompanying key to obtain that team's season data.
  } else {
    // Find the matching team
    teamrow = teamlist.find(x => x.USAVCode === urlParams.teamid);
    // If the teamid is unknown, reload the page using the URL without it
    if (!teamrow) {
      document.location.href = GetCleanURL();
    } else {
      // Otherwise, use the team info and load the team foedata spreadsheet
      Tabletop.init( {
        key: teamrow.TeamSpreadsheet,
        callback: FillTables,
        wanted: [PLAYERSHEET, SETSHEET, TOURNEYSHEET, FOESHEET, OVERALLSHEET]
      });

      // Display the team name and go to default page
      $('.masthead').append(teamrow.TeamName);
      $('.navbar>ul>li>a').removeClass('invisible');
      DisplayPage($('.tourneytab'), $('.tourneypage'));
    }
  }

  // Clear busy spinner
  $('.loading').remove();

  $('body').css('cursor', 'default');
}

function FormatFoeDropdown(d) {
  var setarray = $.grep(setdata, function(e) { return e.OpponentCode == d["UniqueOpponentCode"]; });
  detailtable = "<table class='sets' cellpadding='5' cellspacing='0' border='0' style='padding-left:1em'>";
  if (d.UniqueOpponentCode) {
    detailtable += "<thead><tr><th>Tournament</th><th>Date</th><th>Round</th><th>Us</th><th><p>Them</p></th></tr></thead>";
    $.each(setarray, function(index, value) {
      var tdwlt = "<td class='" + winlosetie(value["Us"], value["Them"]) + " dt-center'>";
      detailtable += "<tr class='set'>" +
                       "<td><p>" + value["Tournament"] + "</p></td>" +
                       "<td class='dt-center'><p>" + value["Date"] + "</p></td>" +
                       "<td class='dt-left'><p>" + value["Round"] + "</p></td>" +
                       tdwlt + value["Us"] + "</td>" +
                       tdwlt + value["Them"] + "</td>" +
                     "</tr>";
    });
    detailtable += "</table>";
  }
  return detailtable;
}

function FormatTourneyDropdown(d) {
  var setarray = $.grep(setdata, function(e) { return e.Tournament == d["Tournament"]; });
  var detailtable = "<table class='sets' cellpadding='5' cellspacing='0' border='0' style='padding-left:1em'>";
  if (setarray[0].OpponentCode) {
    var daterounds = [];
    $.each(setarray, function(index, row) {
      var setdate = row["Date"];
      var setround = row["Round"];
      var dateround = setdate + setround;
      if ($.inArray(dateround, daterounds) < 0)
          daterounds.push(dateround);
    });
    $.each(daterounds, function(index, dtrd) {
      var dtrdsetarray = $.grep(setdata, function(e) { return dtrd == e.Date + e.Round; });
      detailtable += "<tr><td class='dt-right round'>" + dtrdsetarray[0]["Date"] + "</td><td class='round'>" + dtrdsetarray[0]["Round"] + "</td><td class='heading'>Us</td><td><p class='cond heading'>Them</p></td>";
      var evenopp = true;
      var lastopponent = "";
      $.each(dtrdsetarray, function(index, value) {
        var opponent = value['Opponent'];
        if (opponent !== lastopponent) {
          evenopp = !evenopp;
          lastopponent = opponent;
        }
        var tdwlt = "<td class='" + winlosetie(value["Us"], value["Them"]) + " dt-center'>";
        detailtable += "<tr class='set " + (evenopp ? "evenopp" : "oddopp") + "'>" +
                         "<td colspan='2'><p>" + opponent + "</p></td>" +
                         tdwlt + value['Us'] + "</td>" +
                         tdwlt + value['Them'] + "</td>" +
                       "</tr>";
      });
    });
    detailtable += "<tr><td class='heading dt-right'>Points:</td><td>" + d["Points"] + "</tr>";
  }
  detailtable += "</table>";
  return detailtable;
}

function FillTables(dataarray, tabletop) {
  var order = {
    'Nov': 0,
    'Dec': 30,
    'Jan': 61,
    'Feb': 92,
    'Mar': 121,
    'Apr': 152,
    'May': 182,
    'Jun': 213,
    'Jul': 243
  };

  currentdataarray = dataarray;
  currenttabletop = tabletop;

  playerdata = dataarray[PLAYERSHEET].elements;
  setdata = dataarray[SETSHEET].elements;
  foedata = dataarray[FOESHEET].elements;
  tourneydata = dataarray[TOURNEYSHEET].elements;
  overalldata = dataarray[OVERALLSHEET].elements[0];

  $.fn.dataTable.ext.type.order['ranksort-pre'] = function ( data ) {
    if ( data == "" ) {
      return 999.0;
    } else {
      return parseFloat( data );
    }
  };

  $.fn.dataTable.ext.type.order['datesort-pre'] = function ( data ) {
    month = data.substr(0, 3);
    var pat = /\s*\d+/g;
    day = pat.exec(data);
    val = parseInt(order[month], 10) + parseInt(day, 10);
    return val;
  };

  var percent = overalldata.OverallPercent;
  if (percent === "#DIV/0!")
    percent = "0%";
  $('.overalltable').append("<tr>" +
                         "<td>Overall:</td>" +
                         "<td>" + percent + "</td>" +
                         "<td>(" + overalldata.OverallWins + "&nbsp-&nbsp" + overalldata.OverallLosses + ")</td>" +
	                 "<td>#" + overalldata.LatestRanking + "</td>" +
                       "</tr>");

  foetable = $('.foetable').DataTable({
    'data': foedata,
    fixedColumns:   {
      'heightMatch': 'none'
    },
    columns: [
      { 'className': 'details-control',
        'orderable': false,
        'data': null,
        'defaultContent': '',
        'render': function () {
          return "<i class='fa fa-plus-square' aria-hidden='true'></i>";
        } },
      { 'data': 'OpponentName' },
      { 'data': 'LatestRanking',
        'className': 'dt-center',
        'type': 'ranksort' },
      { 'data': 'Percent',
        'className': 'dt-head-center dt-body-right' },
      { 'data': 'Wins',
        'className': 'dt-center' },
      { 'data': 'Losses',
        'className': 'dt-center' }
    ],
    "autoWidth": false,
    paging: false,
    searching: false,
    fixedHeader: {
      header: true,
      footer: false
    },
    rowCallback: function(row, data, index) {
      var winpct = $(row).find('td:eq(3)');
      if (winpct.hasClass('win') || winpct.hasClass('lose') || winpct.hasClass('tie') || winpct.hasClass('unplayed'))
        return;
      $(row).find('td:eq(1)').wrapInner("<p></p>");
      $(row).find('td:eq(2)').wrapInner("<p></p>");
      winpct.wrapInner("<p></p>");
      winpct.addClass(winlosetie(data["Wins"], data["Losses"]));
    },
    'order': [[1, 'asc']]
  });

  // Add event listener for opening and closing details
  $('.foetable tbody').on('click', 'td.details-control', function(){
    var tr = $(this).closest('tr');
    var row = foetable.row(tr);

    if (row.child.isShown()) {
      // This row is already open - close it
      row.child.hide();
      tr.removeClass('shown');
    }
    else {
      // Open this row
      row.child(FormatFoeDropdown(row.data())).show();
      tr.addClass('shown');
    }
  });

  var tourneytable = $('.tourneytable').DataTable({
    'data': tourneydata,
    fixedColumns: {
      'heightMatch': 'none'
    },
    columns: [
      { 'className': 'details-control',
        'orderable': false,
        'data': null,
        'defaultContent': '',
        'render': function () {
            return "<i class='fa fa-plus-square' aria-hidden='true'></i>";
        } },
      { 'data': 'Tournament' },
      { 'data': 'Dates',
        'className': 'dt-center nowrap',
        'type': 'datesort' },
      { 'data': 'Wins',
        'className': 'dt-center' },
      { 'data': 'Losses',
        'className': 'dt-center' },
      { 'data': null,
        'defaultContent': '',
        'className': 'dt-center' },
    ],
    "autoWidth": false,
    paging: false,
    searching: false,
    fixedHeader: {
      header: true,
      footer: false
    },
    rowCallback: function(row, data, index) {
      var tester = $(row).find('td:eq(3)');
      if (tester.hasClass('win') || tester.hasClass('lose') || tester.hasClass('tie') || tester.hasClass('unplayed'))
        return;
      $(row).find('td:eq(1)').wrapInner("<p></p>");
      $(row).find('td:eq(2)').wrapInner("<p></p>");
      $(row).find('td:eq(3)').addClass(winlosetie(data["Wins"], data["Losses"]));
      $(row).find('td:eq(4)').addClass(winlosetie(data["Wins"], data["Losses"]));
      var item = $(row).find('td:eq(5)');
      item[0].innerHTML = data["Finish"] + " / " + data["Teams"];
      item.wrapInner("<p></p>");
      $(row).find('td:eq(6)').wrapInner("<p></p>");
    },
    'order': [[2, 'asc']]
  });

  // Add event listener for opening and closing details
  $('.tourneytable tbody').on('click', 'td.details-control', function () {
    var tr = $(this).closest('tr');
    var row = tourneytable.row( tr );

    if ( row.child.isShown() ) {
      // This row is already open - close it
      row.child.hide();
      tr.removeClass('shown');
    }
    else {
      // Open this row
      row.child( FormatTourneyDropdown(row.data()) ).show();
      tr.addClass('shown');
    }
  });

  playertable = $('.playertable').DataTable({
    'data': playerdata,
    fixedColumns:   {
      'heightMatch': 'none'
    },
    columns: [
      { 'data': 'Number',
        'className': 'dt-center' },
      { 'data': 'Player',
        'className': 'dt-left' },
      { 'data': 'Position',
        'className': 'dt-center' },
      { 'data': 'Height',
        'className': 'dt-center' }
    ],
    "autoWidth": false,
    paging: false,
    searching: false,
    fixedHeader: {
      header: true,
      footer: false
    },
//      rowCallback: function(row, data, index) {
//      },
    'ordering': false
  });
}

TEAMSHEETKEY = "https://docs.google.com/spreadsheets/d/17B2Rt7nFdFIpI2Be0otmxB_qr_hwVSkG505d7pQ2sNA/pubhtml";
TEAMSHEETSHEET = "Sheet1";

FOESHEET = "Opponents";
SETSHEET = "Sets";
PLAYERSHEET = "Players";
TOURNEYSHEET = "Tourneys";
OVERALLSHEET = "Overall";

// Collect URL components into urlParams[] whenever the URL changes
// From: https://stackoverflow.com/a/2880929
var urlParams = {};
(window.onpopstate = function() {
  var match,
      pl     = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function(s) { return decodeURIComponent(s.replace(pl, " ")); },
      query  = window.location.search.substring(1);

  while (match = search.exec(query))
    urlParams[decode(match[1])] = decode(match[2]);
})();

// Set up page to get list of teams (with their USAV code & foedata sheet
// key) from team sheet, when it has completed loading.
$(document).ready(function() {
  // Busy spinner
  $('body').prepend("<i class='fas fa-volleyball-ball fa-spin loading' style='font-size:25vmin'></i>");

  // Set Teams tab to reload page with no specified teamid
  $('.teamstab').attr('href', GetCleanURL());

  // Get contents of team sheet and call specified callback function with the data
  Tabletop.init( {
    key: TEAMSHEETKEY,
    callback: FillKnownPages,
    wanted: [TEAMSHEETSHEET]
  });
});

// ==UserScript==
// @name Monster Minigame Room Monitor
// @namespace https://github.com/spAnser/steamSummerMinigame_newRooms
// @version 1.2.4
// @description Monitors new Rooms for the Monster Minigame
// @author spAnser
// @match *://steamcommunity.com/minigame/
// @match *://steamcommunity.com/minigame
// @updateURL https://raw.githubusercontent.com/spAnser/steamSummerMinigame_newRooms/master/newRooms.user.js
// @downloadURL https://raw.githubusercontent.com/spAnser/steamSummerMinigame_newRooms/master/newRooms.user.js
// @grant GM_xmlhttpRequest
// ==/UserScript==

var lastRoomCheck = 47810 // This is the room the scripts starts of looking from
var refreshSpeed = 2000 // 2000 is 2 seconds and should be fine
var levelThreshhold = 100 // Any game that is over this level will be hidden automatically
var checkSize = 10 // 10 rooms should be plenty to check at one time

$J.fn.sortDivs = function sortDivs() {
    $J("> div", this[0]).sort(dec_sort).appendTo(this[0]);
    function dec_sort(a, b){ return ($J(b).data("sort")) < ($J(a).data("sort")) ? 1 : -1 }
}

function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

addGlobalStyle('#newRooms{position:absolute;top:6px;left:0;width:100%;z-index:10;font-family:\'Press Start 2P\',arial,sans-serif;font-size:8px;line-height:14px}.room{width:90px;display:inline-block;text-align:center;margin:0 2px 2px;color:#34495e;cursor:default}.room .id{font-size:16px;line-height:24px}.room.filling{background-color:#f1c40f}.room.started{background-color:#2ecc71}.room.full{background-color:#e74c3c}.room.soon{background-color:#95a5a6}')

addGlobalStyle('#newRooms .main_btn{background-color: #884691;color: #ee7aff;border: 2px solid #a554b1;font-size:8px;line-height:16px;width:66px;margin:2px 0 5px;text-align:center;cursor:pointer;display:inline-block;text-shadow:1px 1px 0 rgba(0,0,0,.5)}')

addGlobalStyle('.room.started{background-color:#8aaf05;color:#d9ff54;border:2px solid #a3cf06;text-shadow:1px 1px 0 rgba(0,0,0,.5)}')
addGlobalStyle('.room.full{background-color:#af0535;color:#ff5483;border:2px solid #cf063e;text-shadow:1px 1px 0 rgba(0,0,0,.5)}')
addGlobalStyle('.room.filling{background-color:#af7f05;color:#ffd054;border:2px solid #cf9706;text-shadow:1px 1px 0 rgba(0,0,0,.5)}')
addGlobalStyle('.room.soon{background-color:#5c5b58;color:#b0aca3;border:2px solid #6d6b68;text-shadow:1px 1px 0 rgba(0,0,0,.5)}')
addGlobalStyle('#scanningRooms{font-size: 13px;color: #fff;text-align: center;font-family: Arial, Helvetica, Verdana, sans-serif;line-height: 17px;text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.3);}')

$J('.section_overview').prepend(
    $J('<div id="newRooms"></div>')
)

$J('.section_play').append(
    $J('<div id="scanningRooms"></div>')
)

function addRoom(room, size, level, watch) {
    if ($J('#'+room))
        $J('#'+room).remove()

    if (watch) {
        $J('#watchedRooms').append(
            $J('<div id="'+room+'" data-sort="'+room+'" class="room"></div>')
        )
    } else {
        $J('#newRooms').append(
            $J('<div id="'+room+'" data-sort="'+room+'" class="room"></div>')
        )
    }

    _room = $J('#'+room)

    _room.append(
        $J('<div class="id">'+room+'</div>')
    )
    _room.append(
        $J('<div class="size">'+size+'</div>')
    )
    if (level > 0) {
        _room.append(
            $J('<div class="level">lvl '+FormatNumberForDisplay(level)+'</div>')
        )
    } else {
        _room.append(
            $J('<div class="level">-</div>')
        )
    }
    _room.append(
        $J('<a href="Javascript:JoinGame(' + room + ')" class="main_btn">Join</a>')
    )

    if (size >= 1500)
        _room.addClass('full')
    else if (level < 0)
        _room.addClass('soon')
    else if (level < 1)
        _room.addClass('filling')
    else
        _room.addClass('started')
     if (level > levelThreshhold)
        if (!watch)
            _room.remove()
}

function checkRoom(room, watch) {
    watch = typeof watch !== 'undefined' ? watch : false

    GM_xmlhttpRequest({
        method: "GET",
        url: 'http://steamapi-a.akamaihd.net/ITowerAttackMiniGameService/GetGameData/v0001/?gameid='+room+'&include_stats=1',
        onload: function(response) {
            json = $J.parseJSON(response.responseText);
            try {
                playerCount = json.response.stats.num_players
                level = json.response.game_data.level

                addRoom(room, playerCount, level, watch)
                $J('h2>small').html(lastRoomCheck)
                if (room > lastRoomCheck)
                    lastRoomCheck = room
            } catch (e) {
                if (room < lastRoomCheck + 6) {
                    addRoom(room, '-', -1, watch)
                }
            }
            $J('#watchedRooms').sortDivs()
            $J('#newRooms').sortDivs()
        }
    });
    $J('#scanningRooms').html('Scanning Room: ' + lastRoomCheck)
}

function checkRooms(start, range) {
    for (var i = start; i <= start+range; i++) {
        checkRoom(i)
    }
    setTimeout(function(){
        if (!$J('#newRooms>div').length)
            checkRooms(lastRoomCheck, checkSize/2)
    }, 150)
}

function refreshWatchedRooms() {
    $J.each($J('#watchedRooms>div'), function(index) {
        checkRoom($J(this).attr('id'), true)
    });
}

function refreshNewRooms() {
    /*
    $J.each($J('#newRooms>div'), function(index) {
        if ($J(this).hasClass('started')) {
            $J(this).remove()
        }
    });
    */
    $J.each($J('#newRooms>div'), function(index) {
        if (!$J(this).hasClass('soon'))
            checkRoom($J(this).attr('id'))
    });
    checkRooms(lastRoomCheck, checkSize)
}

function findNewRooms() {
    for (var i = lastRoomCheck; i <= lastRoomCheck+1000; i+=10) {
        isValid = validRoom(i)
        if (!isValid)
            break
    }
    lastRoomCheck = i-10
    refreshNewRooms()
    setInterval(refreshNewRooms, refreshSpeed)
}

function validRoom(room) {
    GM_xmlhttpRequest({
        method: "GET",
        url: 'http://steamapi-a.akamaihd.net/ITowerAttackMiniGameService/GetGameData/v0001/?gameid='+room+'&include_stats=1',
        onload: function(response) {
            json = $J.parseJSON(response.responseText);
            try {
                if (json.response.stats.num_players)
                    return true
                else
                    return false
            } catch (e) {}
        }
    });

    return false
}

setTimeout(findNewRooms, 250)

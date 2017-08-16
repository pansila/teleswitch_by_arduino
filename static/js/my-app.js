var port_idx = 0;
var user_idx = 0;
var user_data = {};
var newusername = "";

function flipswitch_callback(e) {
  var portnum = $(this).closest('.sbs-container').find('select').val();
  var user = $(this).closest('.upage-content').find('a.username').text();
  update_port(user, portnum, this.checked ? 1 : 0);

  var post = $.ajax({
    url: "/control",
    data: JSON.stringify({"portnum": portnum, "status":this.checked}),
    type: "POST",
    contentType: "application/json",
    success: function(data){
      console.log(data);
    },
    error: function(){
      console.log("control port error!");
    }
  });
}

function update_data(call_back) {
  $.ajax({
    url: "/update",
    data: JSON.stringify(user_data),
    type: "POST",
    contentType: "application/json",
    success: function(data){
      if (call_back != null)
        call_back(data);
      console.log(data);
    },
    error: function(){
      console.log("update port error!");
    }
  });
}

function update_port(user, port, state, c1, c2) {
  var found = 0;
  for (var u in user_data) {
    if (u === user) {
      if (state === -1) {
        delete user_data[u][port];
      } else {
        if (user_data[u][port] == null) {
          user_data[u][port] = {"state":1, "comment1":"11:22:33:44:55:66", "comment2":"BBIC4-410n"}
        } else {
          user_data[u][port]["state"] = state;
        }
        if (c1 != null) {
          user_data[u][port]["comment1"] = c1;
        }
        if (c2 != null) {
          user_data[u][port]["comment2"] = c2;
        }
      }
      found = 1;
    }
  }
  if (!found) {
    if (user == null || port == null) {
      return;
    }
    if (c1 == null) {
      c1 = "comment1";
    }
    if (c2 == null) {
      c2 = "comment2";
    }
    user_data[user][port] = {"state":state, "comment1":c1, "comment2":c2};
  }
  //console.log(user_data);
  update_data();
}

var portchange = 0;
function port_focus(evt) {
  portchange = $(this).val();
}

function port_change(evt) {
  var user = $(this).closest('.upage-content').find('a.username').text();
  var newport = $(this).val();
  var availports = get_available_ports();
  var pre = undefined;

  if (portchange === 0) {
    // retrieving the previous data by focus callback only takes effect once
    pre = $(this).data("previous");
  } else {
    pre = portchange;
  }

  if (pre !== 0 && pre !== undefined) {
    if (newport === "delete") {
      update_port(user, pre, -1);
      $(this).closest(".port_container").remove();
      return;
    }

    $(this).data("previous", $(this).val());

    if (availports.length === 0 || !availports.includes(newport)) {
      $(this).val(pre);
      $(this).data("previous", pre);
      portchange = 0;
      if (availports.length === 0) {
        alert("no more available port")
      } else {
        alert("target port used")
      }
      return;
    }

    update_port(user, pre, -1);
  } else {
    console.log("port changing with no previous value");
    return;
  }

  // to avoid response delay by server due to sending the second request too fast
  setTimeout(function(){
    update_port(user, newport, 1);
    portchange = 0;
  }, 50)
}

function show_input() {
  $(this).prev().val($(this).text()).removeClass("hidden");
  $(this).addClass("hidden");
  //$(this).focus();
}

function hide_input() {
  var user = $(this).closest(".upage-content").find("a.username").text();
  var port = $(this).closest(".port_container").find("select").val();
  var state = $(this).closest(".port_container").find("input[type=checkbox]").prop("checked") ? 1 : 0;
  var c1;
  var c2;
  if ($(this).parent().hasClass("leftcomment")) {
    c1 = $(this).val();
  }
  if ($(this).parent().hasClass("rightcomment")) {
    c2 = $(this).val();
  }
  update_port(user, port, state, c1, c2);
  $(this).addClass("hidden");
  $(this).next().text($(this).val()).removeClass("hidden");
}

function enter_check(evt) {
  if (evt.which == 13) {
    evt.preventDefault();
    $(this).focusout();
  }
  evt.stopPropagation();
}

function create_port(port, config) {
  if (config == null) {
    config = {"state":1, "comment1":"11:22:33:44:55:66", "comment2":"BBIC4-410n"}
  }
  var new_blank=$("div.port_blank").clone();
  new_blank.removeClass("hidden port_blank");
  new_blank.find("#af-flipswitch").next().attr("for", "ele_" + port_idx);
  new_blank.find("#af-flipswitch").attr("id", "ele_" + port_idx);
  port_idx++;
  new_blank.find('input:checkbox').prop("checked", config["state"]).change(flipswitch_callback);
  new_blank.find("select").val(port).focus(port_focus).change(port_change);
  new_blank.find(".leftcomment label").text(config["comment1"]).click(show_input);
  new_blank.find(".rightcomment label").text(config["comment2"]).click(show_input);
  new_blank.find(".leftcomment input").keydown(enter_check).focusout(hide_input);
  new_blank.find(".rightcomment input").keydown(enter_check).focusout(hide_input);

  return new_blank;
}

function create_group(user, ports) {
  var page_id = "#uib_page_3";
  var new_blank=$("li.view_blank").clone();
  new_blank.removeClass("hidden view_blank");
  new_blank.find("a").text(user);
  page_id = page_id + user_idx;
  new_blank.click(function(){
    activate_subpage(page_id);
  })
  $("li.view_blank").parent().append(new_blank);

  new_blank=$("ul.edit_blank").clone();
  new_blank.removeClass("hidden edit_blank");
  new_blank.find(".swipe-content a").text(user);
  $("ul.edit_blank").parent().append(new_blank);

  new_blank=$("div.page_blank").clone();
  new_blank.removeClass("hidden page_blank");
  new_blank.attr("id", "uib_page_3" + user_idx);
  new_blank.find("a.username").text(user);
  new_blank.insertBefore("#uib_page_4");

  user_data[user] = {};
  for (var port in ports) {
    user_data[user][port] = ports[port];
    var p = create_port(port, ports[port]);
    new_blank.find("div.user_ports").append(p);
  }

  user_idx++;
}

function delete_group(user) {
  var u = user;
  $("#uib_page_1 li a:contains(" + user + ")").closest("li").remove();
  $(".upage-content a:contains(" + user + ")").closest(".upage-content").remove();

  delete user_data[u];
  update_data();
}

function make_content(data) {
  user_data = data;
  for (var user in data) {
    create_group(user, data[user]);
  }
}

function load_data() {
  $.ajax({
    url: "/load",
    success: make_content,
    error: function(){
      console.log("load data error!");
    }
  });
}

function generate_userlist() {
  $("#uib_page_5").find("select").empty();
  for (var user in user_data) {
    var opt = $("<option value=" + user + ">" + user + "</option>")
    $("#uib_page_5").find("select").append(opt);
  }
}

function get_portnum() {
  return $(".port_blank option").length - 1;
}

function get_available_ports() {
  var usedports = [];
  var ports = [];
  for (var user in user_data) {
    for (var port in user_data[user]) {
      usedports.push(port);
    }
  }
  for (var i = 1; i <= get_portnum(); i++) {
    if (!usedports.includes(i.toString())) {
      ports.push(i.toString());
    }
  }
  return ports;
}

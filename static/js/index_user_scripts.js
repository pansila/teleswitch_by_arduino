/*jshint browser:true */
/*global $ */(function()
{
  "use strict";
  /*
  hook up event handlers
  */
  function register_event_handlers()
  {
    $(document).on("click", ".adduser_ok", function(evt)
    {
      var user = $(this).closest(".upage-content").find("input[type=text]").val();
      create_group(user);
      activate_subpage("#uib_page_1");
      update_data();
    });

    $(document).on("click", ".adduser_cancel", function(evt)
    {
      activate_subpage("#uib_page_1");
    });

    $(document).on("click", ".removeuser_ok", function(evt)
    {
      var user = $(this).closest(".upage-content").find("select").val();
      delete_group(user);
      activate_subpage("#uib_page_1");
    });

    $(document).on("click", ".removeuser_cancel", function(evt)
    {
      activate_subpage("#uib_page_1");
    });

    $(document).on("click", ".add_port", function(evt)
    {
      var p = get_available_ports();
      if (p.length === 0) {
        alert("No more available port");
        return;
      }
      var port = create_port(p[0]);
      $(evt.target).parent().children(".user_ports").append(port);

      update_port($(evt.target).parent().find("a.username").text(), p[0], 1);
    });

    $(document).on("click", ".btn_adduser", function(evt)
    {
      activate_subpage("#uib_page_4");
    });

    $(document).on("click", ".btn_removeuser", function(evt)
    {
      generate_userlist();
      activate_subpage("#uib_page_5");
    });
  }
  document.addEventListener("app.Ready", register_event_handlers, false);
})();

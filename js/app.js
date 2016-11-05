
var base = 'http://joinedupdata.org/PoolParty/api/thesaurus/';

function init(){
  if (location.pathname === '/') {
    console.log('we are in our simple SPA')
    if(location.hash) getProject(location.hash);
    search();
    window.addEventListener("hashchange", hashListener);
  } else {
    // reset to default values
    $('#container').addClass('default-container');
    $('.hide').show();
  }
}


function ajaxLoarder(){
  location.hash = "#results";
}

function getSearchData (){
  return {
    term: $('#term').val(),
    code: $('#code').val(),
    source: $('#source').val(),
    start: $('#start').val(),
    match: $('#match').val(),
    destination: $('#destination').val(),
  }
}

function search() {
  searchToggleOptions();
  accordionResults();
  searchTipsHover();
  sideBarSearch();
  $('#submit').click(function(event){
    ajaxLoarder();
    var data = getSearchData;
    httpPost(data); //TODO change to the httpPost
    event.preventDefault();
  })
}

function sideBarSearch(){
  $("#SearchInput")
  .focus(function(){
    $(this).css("background", "none")
  })
  .bind(($.browser.opera ? "keypress" : "keydown"), function(event) {
    var value = $(this).val();
    if (event.keyCode == "13" && value !== "") {
      ajaxLoarder();
      httpPost({term: value, code: "", source:"er", start: "er", match: "er", destination: "er"});
      return false;
    }
  });
}

function httpGet(apiEndPoint, callback){
  $.ajax({
    url: base + apiEndPoint, // to change when live
    dataType: 'JSON',
    success: callback
  });
}

function getProject (projectHashName) {
  console.log('projectHashName', projectHashName);
  //hide all tabs
  $('#wrapper').children().hide();
  // show current tab
  $(projectHashName).show();
  var projectName = projectHashName.replace(/^\#/, '');
  // this is the default no need to make any http call
  if (projectName === 'home' || projectName === 'translator' || projectName === 'results') return false
  // check if expList ul has li elments already, if it does, no need to make http calls
  if ($(projectHashName).find('.expList').has('li').length) return false

  return httpGet(projectName + '/schemes', function(data){
    data.schemes.forEach(function(obj, index){
      $(projectHashName)
        .find('.expList')
        .append("<li class='scheme'>"+obj.subjects+"<ul class='hide' id='"+obj.title+"'></ul></li>")

      var childApi = projectName +"/childconcepts?parent=http://joinedupdata.org/"+projectName+"/"+ obj.title

      httpGet(childApi, function(children){
        children.forEach(function(child){
          var childId = child.prefLabel.split(" ")[0];
          $('#'+ obj.title)
          .append("<li class='child'><a href='"+child.uri+"'>"+child.prefLabel+"</a><ul class='hide' id='"+childId+"'></ul></li>")
          var grandChildApi = childApi + "/" + child.prefLabel;
          httpGet(grandChildApi, function(grandChildren) {
            grandChildren.forEach(function(grandChild){
              $('#' + childId)
              .append("<li class='child'><a href='"+grandChild.uri+"'>"+grandChild.prefLabel+"</a></li>")
            })
          })
        });
        // attach events after adding all the dom nodes
        if(index === (data.schemes.length - 1))prepareList(projectName);
      });
    });
  });
}

function hashListener (){
  var hash = location.hash;
  getProject(hash);
}

function searchTipsHover () {
  var elms = [
    "#translator .column-left",
    "#translator .column",
    "#translator .column-right",
    "#translator .col-flx-1",
    "#translator .col-flx-2",
    "#translator .col-flx-0"
  ];
  $(elms.join(','))
  .hover(function(){
    $(this).find('.hide-hover').animate({opacity: 1}, 500);
  }, function(){
    $(this).find('.hide-hover').animate({opacity: 0}, 250);
  });
}

function searchToggleOptions(){
  var dis1 = document.getElementById("term");
  dis1.onchange = function () {
     if (this.value != "" || this.value.length > 0) {
      document.getElementById("code").type = 'hidden';
       }
    }
  var dis2 = document.getElementById("code");
  dis2.onchange = function () {
     if (this.value != "" || this.value.length > 0) {
      document.getElementById("term").type = "hidden";
       }
    }
}

function results(data){
  // change to results tab
  $('#search-results-no b').html('Simple search results ' + data.no);
  // //remove existing elements
  $('#search-results').html("");
  $('#trans').html(" ");

  data['Links_and_Matches'].forEach(function(link){
    $('#search-results').append("<li style='font-size:1.2em'><a href="+link[0]+">"+link[1]+"</a></li>")
  });
  $('#trans-no b').html('Optional: translations ' + data.no2);
  data.trans.forEach(function(link){
    $('#trans').append("<li style='font-size:1.2em'><a href="+link[0]+">"+link[1]+"</a></li>")
  });
  $('#xml-download a').prop('href', data.DownloadXML);
}

function accordionResults(){
  var acc = document.getElementsByClassName("accordion");
	var i;
  for (i = 0; i < acc.length; i++) {
	  acc[i].onclick = function() {
		var active = document.querySelector(".accordion.active");
		if (active && active != this) {
		  active.classList.remove("active");
		  active.nextElementSibling.classList.remove("show");
		}
		this.classList.toggle("active");
		this.nextElementSibling.classList.toggle("show");
	  }
	}
}

function httpPostProxy(data){
  var dataurl = base + '/mocks/education.json';
  console.log('dataurl', dataurl);
  $.ajax({
    url: dataurl,
    dataType: 'JSON',
    success: function(data){
      console.log('proxy data', data);
      results(data);
    }
  });
}

function httpPost(data){
  $.ajax({
    type: 'POST',
    url: 'http://localhost:5000/translator',
    data: data,
    success: function(data){
      results(data);
    },
    dataType: 'JSON'
  });
}

function prepareList(currentProject) {
    $('#'+currentProject+ ' .expList').find('li:has(ul)')
    .unbind('click')
    .click( function(event) {
        if (this == event.target) {
            $(this).toggleClass('expanded');
            $(this).children('ul').toggle('medium');
        }
        return false;
    })
    .addClass('collapsed')
    .children('ul').hide();

    $('#'+currentProject+' .expandList')
    .unbind('click')
    .click( function() {
        $('.collapsed').addClass('expanded');
        $('.collapsed').children().show('medium');
    })
    $('#'+currentProject+ ' .collapseList')
    .unbind('click')
    .click( function() {
      $('#'+currentProject+ ' .collapsed').removeClass('expanded');
      $('#'+currentProject+ ' .collapsed').children().hide('medium');
    })
};

$(document).ready(function(){
  init();
})

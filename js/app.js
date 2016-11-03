var schemaBase = 'http://localhost/PoolParty/OpenConfigPathResourceProvider/frontendroot?fileName=default/js';
var conceptsBase = 'http://localhost/PoolParty/OpenConfigPathResourceProvider/frontendroot?fileName=default/js';

function init(){
  if (location.pathname === '/') {
    console.log('we are in our simple SPA')
    if(location.hash) getProject(location.hash);
    //search();
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
function search() {
  searchToggleOptions();
  accordionResults();
  $('#submit').click(function(event){
    // ajaxLoarder();
    var data = {
      term: $('#term').val() || '',
      code: $('#code').val() || '',
      source: $('#source').val() || '',
      start: $('#start').val() || '',
      match: $('#match').val() || '',
      destination: $('#destination').val() || '',
    }
    httpPost(data);
    event.preventDefault();
  })
}

function sideBarSearch(){
  $("#SearchAutoCompleteInput").clearField().bind(($.browser.opera ? "keypress" : "keydown"), function(event) {
    var value = $(this).val();
    // ajaxLoarder();
    if (event.keyCode == "13" && value !== "") {
      httpPost({term: value});
      return false;
    }
}

function httpGet(apiEndPoint, isConcept, callback){
  var base = isConcept ? conceptsBase : schemaBase;
  $.ajax({
    url: base + '/mocks/'+apiEndPoint+'.json', // to change when live
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
  if (projectName === 'home' || projectName === 'translator') return false
  // check if expList ul has li elments already, if it does, no need to make http calls
  if ($(projectHashName).find('.expList').has('li').length) return false

  return httpGet(projectName, false, function(data){
    data.schemes.forEach(function(obj, index){
      $(projectHashName)
        .find('.expList')
        .append("<li class='scheme'>"+obj.title+"<ul class='hide' id='"+obj.title+"'></ul></li>")
      httpGet(obj.title, true, function(children){
        children.forEach(function(child){
          $('#'+ obj.title)
          .append("<li class='child'><a href='"+child.uri+"'>"+child.prefLabel+"</a></li>")
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
  $('#results-no b').html('Simple search results ' + data.no);
  //remove existing elements
  $('#results').html("");
  $('#trans').html(" ");
  data['Links_and_Matches'].forEach(function(link){
    $('#results').append("<li style='font-size:1.2em'><a href="+link[0]+">"+link[1]+"</a></li>")
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

function httpPost(data){
  $.ajax({
    type: "POST",
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

init();

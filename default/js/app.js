
var base = 'http://allan_lukwago:allanlukwago@joinedupdata.org/PoolParty/api/thesaurus/';

// this is a quick fix for a set of APIS that arenot working like the rest
var apisThatArentWorking = {
   'water-sanitation-and-flood-protection_wb' : 'http://joinedupdata.org/PoolParty/api/thesaurus/Sectors/childconcepts?parent=http://joinedupdata.org/Sectors/world_bank_sectors/water-sanitation-and-flood-protection_wb)',
   'industry-and-trade_wb': 'http://joinedupdata.org/PoolParty/api/thesaurus/Sectors/childconcepts?parent=http://joinedupdata.org/Sectors/world_bank_sectors/industry-and-trade_wb',
   'energy-and-mining_wb':'http://joinedupdata.org/PoolParty/api/thesaurus/Sectors/childconcepts?parent=http://joinedupdata.org/Sectors/world_bank_sectors/energy-and-mining_wb',
   'agriculture-fishing-and-forestry_wb': 'http://joinedupdata.org/PoolParty/api/thesaurus/Sectors/childconcepts?parent=http://joinedupdata.org/Sectors/world_bank_sectors/agriculture-fishing-and-forestry_wb',
   'geographic_regions':'http://joinedupdata.org/PoolParty/api/thesaurus/geo-pol/childconcepts?parent=http://joinedupdata.org/geo-pol/geographic_regions',
   'economic_groupings':'http://joinedupdata.org/PoolParty/api/thesaurus/geo-pol/childconcepts?parent=http://joinedupdata.org/geo-pol/economic_groupings',
   'security_groupings':'http://joinedupdata.org/PoolParty/api/thesaurus/geo-pol/childconcepts?parent=http://joinedupdata.org/geo-pol/security_groupings',
   'health_groupings':'http://joinedupdata.org/PoolParty/api/thesaurus/geo-pol/childconcepts?parent=http://joinedupdata.org/geo-pol/health_groupings',
   'other_groupings':'http://joinedupdata.org/PoolParty/api/thesaurus/geo-pol/childconcepts?parent=http://joinedupdata.org/geo-pol/other_groupings'
};

function init(){
  if (location.pathname === '/') {
    console.log('we are in our simple SPA')
    if(location.hash) getProject(location.hash);
    search();
    window.addEventListener("hashchange", hashListener);
  } else {
    // reset to default values
    $('.footer').css("position", "relative");
    $('#container').addClass('default-container');
    $('.hide').show();
  }
}


function ajaxLoarder(){
  // add ajax loading gif
  location.hash = "#results";
  $('.accordion').hide();
  $("#loader").show();
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
  $('.search-submit').click(function(event){
    ajaxLoarder();
    var data = getSearchData();
    httpPost(data, false); //TODO change to the httpPost
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
      httpPost({term: value, code: "", source:"er", start: "er", match: "er", destination: "er"}, true);
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

function httpGetProxy(apiEndPoint, callback){
  $.ajax({
    url: 'http://localhost/PoolParty/OpenConfigPathResourceProvider/frontendroot?fileName=default/js/mocks/' + apiEndPoint + '.json', // to change when live
    dataType: 'JSON',
    success: callback
  });
}

function themeTitle(obj){
  return obj.subjects[0].length < 2 ? obj.title : obj.subjects[0];
}

function getIdOfApiResponse (uri) {
  var uriArr = uri.split('/');
  return uriArr[uriArr.length - 1];
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
  if (projectName === 'data_standards_index') return standardsIndex(projectName);
  // check if expList ul has li elments already, if it does, no need to make http calls
  if ($(projectHashName).find('.expList').has('li').length) return false

  return httpGet(projectName + '/schemes', function(data){
    data.forEach(function(obj, index){
      var title = themeTitle(obj)
      $(projectHashName)
        .find('.expList')
        .append("<li class='scheme'><button class='conceptBtn collapsed'></button><a target='_blank' href='"+obj.uri+"' target='_blank'>"+title+"</a><ul class='hide' id='"+obj.title+"'></ul></li>")

      var id = getIdOfApiResponse(obj.uri);

      var baseConceptsApi = projectName +"/childconcepts?parent=";

      var ChildrenApi = apisThatArentWorking[id] !== undefined ?
            apisThatArentWorking[id] : baseConceptsApi + obj.uri;

      httpGet(ChildrenApi, function(children){
        children.forEach(function(child){
          var childId = child.prefLabel.split(" ")[0];
          var id = getIdOfApiResponse(obj.uri);

          $('#'+ obj.title)
          .append("<li class='child'><button class='conceptBtn collapsed'></button><a target='_blank' href='"+child.uri+"'>"+child.prefLabel+"</a><ul class='hide' id='"+childId+"'></ul></li>")

          var grandChildrenApi = apisThatArentWorking[id] !== undefined ?
              apisThatArentWorking[id] : baseConceptsApi + child.uri;

          httpGet(grandChildrenApi, function(grandChildren) {
            grandChildren.forEach(function(grandChild){
              $('#' + childId)
              .append("<li class='child'><a target='_blank' href='"+grandChild.uri+"'>"+grandChild.prefLabel+"</a></li>")
            })
          });

        });
        // attach events after adding all the dom nodes
        if(index === (data.length - 1))prepareList(projectName);
      });
    });
  });
}

function standardsIndex(container){
  var projectsData = ['Sectors', 'Indicators', 'Surveys']
    .map(function (projectName){
      return new Promise(function(resolve){
        httpGet(projectName + '/schemes', function(data){
            resolve(data);
        });
      });
    });

  Promise.all(projectsData).then(function(data){
    var flattened = data.reduce(function(acc, val){
      return acc.concat(val)
    }, [])

    var objKeys = [];

    var alphabeticalObjects = flattened.reduce(function(acc, obj){
      var title = themeTitle(obj)
      var firstLetter = title[0].toUpperCase();
      if(acc[firstLetter] === undefined) {
        acc[firstLetter] = []
        objKeys.push(firstLetter);
      }
      acc[firstLetter].push(obj)
      return acc;
    }, {});

    objKeys.sort().forEach(function(key){
      var items = alphabeticalObjects[key].map(function(item){
        var title = themeTitle(item)
        return "<li class='child'><a target='_blank' href='"+item.uri+"'>"+title+"</a></li>";
      });
      $('#'+container)
        .find('.expList')
        .append("<li class='scheme'><button class='conceptBtn collapsed'></button>"+key+"<ul class='hide'>"+items.join("")+"</ul></li>")
    });
    prepareList(container);
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
  ];
  $(elms.join(','))
  .hover(function(){
    $(this).find('.hide-hover').animate({opacity: 1}, 500);
  }, function(){
    $(this).find('.hide-hover').animate({opacity: 0}, 250);
  });
  // advanced hover
  ['.advanced-hover-0', '.advanced-hover-1'].forEach(function(element, index){
    $(element).hover(function(){
      $('#advanced-tip-' + index).show().animate({opacity: 1}, 500);
    }, function(){
      $('#advanced-tip-' + index).hide().animate({opacity: 0}, 250);
    });
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
    $('#search-results').append("<li style='font-size:1.2em'><a target='_blank' href="+link[0]+">"+link[1]+"</a></li>")
  });
  $('#trans-no b').html('Optional: translations ' + data.no2);
  data.trans.forEach(function(link){
    $('#trans').append("<li style='font-size:1.2em'><a target='_blank' href="+link+">"+link+"</a></li>")
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


function httpPost(data, isSimpleSearch){
  $.ajax({
    type: 'POST',
    url: 'http://joinedupdata.org:8000/translator',
    data: data,
    success: function(data){
      $("#loader").hide();
      if(isSimpleSearch){
        $("#trans-no,#xml-download-no").hide();
        $("#search-results-no").show();
        $("#search-results-no").click();
      } else {
        $(".accordion").show();
      }
      results(data);
    },
    dataType: 'JSON'
  });
}

function prepareList(currentProject) {
    $('#'+currentProject+ ' .expList').find('.conceptBtn')
    .click( function(event) {
        $(this).parent().children('ul').toggleClass('show');
        $(this).toggleClass('expanded')
    });

    $('#'+currentProject+' .expandList')
    .click( function() {
        $('#'+currentProject+ ' .conceptBtn').removeClass('collapsed').addClass('expanded');
        $('#'+currentProject+ ' .hide').removeClass('hide').addClass('show');
    });

    $('#'+currentProject+ ' .collapseList')
    .unbind('click')
    .click( function() {
      $('#'+currentProject+ ' .conceptBtn').removeClass('expanded').addClass('collapsed');
      $('#'+currentProject).find('.show').removeClass('show').addClass('hide');
    })
};


$(document).ready(function(){
  init();
})

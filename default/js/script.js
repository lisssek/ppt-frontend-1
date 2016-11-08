// methods to set and get the language via cookie
var initLang = function() {
  if ($.cookie("language") == null) {
    $.cookie("language", PPP.autocompleteLanguage);
  }else{
      //check if lang stored in cookie is actually available in current project
      var cookie_lang = $.cookie("language");
      var is_lang_avail = false;
      languages.forEach(function(language){
          if(language === cookie_lang)
              is_lang_avail = true;
      });
      if(!is_lang_avail){
          $.cookie("language", languages[0]);
      }
  }
  setLang();
  $("#languageSelector select").val($.cookie("language"));
};

var changeLang = function(select) {
  var option = select.options[select.selectedIndex];
  if (option) {
    $.cookie("language", option.value);
    setLang();
  }
};

var setLang = function() {
  var elInput = PPP.AC.oDynamicAutoComplete.getInputEl();
  elInput.style.backgroundColor = "";
  elInput.value = "";
  if (autocompleteNoResultsInfoBox !== undefined) {
    $('#' + autocompleteNoResultsInfoBox).hide();
  }
  PPP.autocompleteLanguage = $.cookie("language");
  $("#resources").find(".resource").each(function(index, element) {
    if($(element).attr('id') == PPP.autocompleteLanguage) {
      $(element).show();
    }
    else {
      $(element).hide();
    }
  })
}


;(function($) {

var indexCache = new Object();
var indexStartHeight = 530;
var indexStepHeight = 182;
var indexMinHeight;

$(document).ready(function() {

  $('#debug').click(function(event) {
    $target = $(event.target);
    if( $target.is("span") ) {
      $(this).find('pre').toggle();
    }
  });

  // init search field
  $("#SearchAutoCompleteInput").clearField().bind(($.browser.opera ? "keypress" : "keydown"), function(event) {
    console.log('input');
    if (event.keyCode == "13") {
      console.log(' PPP.autocompleteLanguage: ', PPP);
      // var template = PPP.autocompleteLanguage == "de" ? "nicht_gefunden" : "not_found";
      // console.log('template', template);
      // document.location.href = projectView + "." + template;
      return false;
    }
    return true;
  });

  // set click event to characters in the index bar
  $("#index-bar").find("a").click(function() {
    $(this).showIndex();
    $(this).parent().siblings().removeClass("active");
    $(this).parent().addClass("active");
  });

  // show more on resource page
  showMore = function() {
    var link = $('#resources a.more');
    if($('#resources ul.default.more').is(':visible')) {
      $('#resources ul.default.more').hide();
      $(link).text(viewMore[PPP.autocompleteLanguage]);
    } else {
      $('#resources ul.default.more').show();
      $(link).text(viewLess[PPP.autocompleteLanguage]);
    }
  }


  moreIndex = function (facetId) {
    var height = $("div.index_list").height();
    var maxHeight = $("div.index_list ul").height();
    if ((height + indexStepHeight) < maxHeight) {
      $("div.index_list").animate({"max-height":height + indexStepHeight});
    } else {
      $("div.index_list").animate({"max-height":maxHeight});
      $("div.more_less a.more:visible").hide();
    }
    $("div.more_less a.less:not(:visible)").show();
  }

  lessIndex = function () {
    var height = $("div.index_list").height();
    if ((height - indexStepHeight) > indexMinHeight) {
      $("div.index_list").animate({"max-height":height - indexStepHeight});
    } else {
      $("div.index_list").animate({"max-height":indexMinHeight});
      $("div.more_less a.less:visible").hide();
    }
    $("div.more_less a.more:not(:visible)").show();
  }


  // Sparql all geo data and set as markers
  addMarkers = function (iconUrl) {
    var query = "\
    PREFIX skos:<http://www.w3.org/2004/02/skos/core#>\
    PREFIX dbpprop:<http://de.dbpedia.org/property/>\
    PREFIX dbpedia-owl:<http://dbpedia.org/ontology/>\
    PREFIX vcard:<http://www.w3.org/2006/vcard/ns#>\
    SELECT *\
    WHERE {\
      ?concept a skos:Concept ;\
               skos:prefLabel ?label ;\
               dbpprop:ew ?lon ;\
               dbpprop:ns ?lat .\
      OPTIONAL { ?concept dbpedia-owl:thumbnail ?thumbnail }\
      OPTIONAL { ?concept vcard:street-address ?streetAddress }\
      OPTIONAL { ?concept vcard:postal-code ?postalCode }\
      OPTIONAL { ?concept vcard:locality ?locality }\
      OPTIONAL { ?concept vcard:tel ?tel }\
    }";
    var data = {query: query, "content-type": "application/json"};
    $.getJSON(sparqlEndpointUrl, data, function (data) {
      var data = data.results.bindings;
      $.each(data, function (index, element) {
        var position = getPosition(element.lon.value, element.lat.value);
        var markerClick = function () {
          window.location.href = element.concept.value;
        }
        var thumbnail     = element.thumbnail ? element.thumbnail.value : "";
        var streetAddress = element.streetAddress ? element.streetAddress.value : "";
        var postalCode    = element.postalCode ? element.postalCode.value : "";
        var locality      = element.locality ? element.locality.value : "";
        var tel           = element.tel ? element.tel.value : "";
        var content = generatePopupContent(element.label.value, thumbnail, postalCode, locality, streetAddress, tel);
        addMarker(position, content, iconUrl, false, true, markerClick);
      });
    });
  }


  // put the content for the map popup out
  generatePopupContent = function (title, thumbnail, postalCode, locality, streetAddress, tel) {
    var content = "<h1>";
    if (thumbnail) {
      content += '<img src="' + thumbnail + '" alt="Image: ' + title + '" width="100" height="100" />';
    }
    content += title + '</h1>';
    if (streetAddress || locality || tel) {
      content += '<p class="address">';
      if (streetAddress) {
        content += streetAddress + '<br />';
      }
      if (locality) {
        content += postalCode + ' ' + locality + '<br />';
      }
      if (tel) {
        content += phone[PPP.autocompleteLanguage] + ': ' + tel;
      }
      content += '<p>';
    }
    return content;
  }

  // get the geo data
  getPosition = function (lon, lat) {
    if (typeof lon  === "string") {
      lon = (lon == "") ? 0 : parseFloat(lon);
      lat = (lat == "") ? 0 : parseFloat(lat);
    }
    // workaround for dbpedia bug
    for (;lon > 20; lon = lon/10);
    for (;lat > 60; lat = lat/10);
    return transform(lon, lat);
  };


  // transforms geo data
  transform = function (lon, lat) {
    var fromProj  = new OpenLayers.Projection("EPSG:4326");
    var toProj    = new OpenLayers.Projection("EPSG:900913");
    return new OpenLayers.LonLat(lon, lat).transform(fromProj, toProj);
  }


  // add the OpenStreetMap
  addMap = function () {
    map = new OpenLayers.Map ("map", {
      controls:[
          new OpenLayers.Control.Navigation(),
          new OpenLayers.Control.PanZoomBar(),
          new OpenLayers.Control.ScaleLine({geodesic: true}),
          new OpenLayers.Control.MousePosition()
      ],
      maxExtent:
          new OpenLayers.Bounds(-180.0000, -90.0000, 180.0000, 90.0000),
      numZoomLevels: 12,
      units: 'm',
      projection: new OpenLayers.Projection("EPSG:4326"),
      displayProjection: new OpenLayers.Projection("EPSG:4326")
    } );

    var layer = new OpenLayers.Layer.OSM.Mapnik("Mapnik");
    map.addLayer(layer);

    markers = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markers);
  };


  // add a marker on the map
  addMarker = function (position, popupContentHTML, iconUrl, showPopupOnLoad, showPopupOnHover, clickCallBack) {
    var popupClass = OpenLayers.Class(OpenLayers.Popup.FramedCloud, {
      'autoSize': true,
      'minSize': new OpenLayers.Size(300, 200)
    });

    var size = new OpenLayers.Size(21, 25);
    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
    var icon = new OpenLayers.Icon(iconUrl, size, offset);

    var feature = new OpenLayers.Feature(markers, position);
    feature.closeBox              = !showPopupOnHover;
    feature.popupClass            = popupClass;
    feature.data.popupContentHTML = popupContentHTML;
    feature.data.overflow         = "auto";
    feature.data.icon             = icon;

    if (showPopupOnLoad) {
      feature.popup = feature.createPopup(feature.closeBox);
      map.addPopup(feature.popup);
      feature.popup.show();
    }

    var markerToggle = function (evt) {
        if (this.popup == null) {
            this.popup = this.createPopup(this.closeBox);
            map.addPopup(this.popup);
            this.popup.show();
        } else {
            this.popup.toggle();
        }
        OpenLayers.Event.stop(evt);
    };

    var marker = feature.createMarker();
    if (showPopupOnHover) {
      marker.events.register("mouseover", feature, markerToggle);
      marker.events.register("mouseout", feature, markerToggle);
      if (clickCallBack) {
        marker.events.register("mousedown", feature, clickCallBack);
      }
    } else {
      marker.events.register("mousedown", feature, markerToggle);
    }

    markers.addMarker(marker);
  };

});





$.fn.extend({

  clearField: function() {
    if (this.val() == '') {
      this.val(this.attr('title'));
    }
    return this.focus(function() {
      if ($(this).val() == $(this).attr('title')) {
        $(this).val('');
      }
    }).blur(function() {
      var $noResultsInfoBox = $("#" + autocompleteNoResultsInfoBox);
      if ($(this).val() == '' || $noResultsInfoBox.is(":visible")) {
        $(this).css("background-color", "");
        $("#" + autocompleteNoResultsInfoBox).hide();
        $(this).val($(this).attr('title'));
      }
    });
  },

  // displays a list of concepts depended on the selected character
  showIndex: function () {
    var character = $(this).html();
    if (character.length <= 0) {
      character = "A";
    }

    var content = $("div.content_wrapper");
    if (indexCache[character]) {
      content.html(indexCache[character]);
    } else {
      var query = "\
      PREFIX skos:<http://www.w3.org/2004/02/skos/core#>\
      SELECT DISTINCT ?concept ?prefLabel\
      WHERE {\
        ?concept a skos:Concept .\
        ?concept skos:prefLabel ?prefLabel .\
        FILTER(regex(str(?prefLabel),'^"+ character +"','i') && lang(?prefLabel) = '"+ PPP.autocompleteLanguage +"').\
      }\
      ORDER BY ?prefLabel";
      var data = {query: query, "content-type": "application/json"}
      $.getJSON(sparqlEndpointUrl, data, function (data) {
        var concepts = data.results.bindings;
        if (concepts.length <= 0) {
          var ul_list = $("<p>").html(PPP.infoBoxText[PPP.autocompleteLanguage]);
        } else {
          concepts.sort(function(a, b) {
            var la = a.prefLabel.value.toLowerCase();
            var lb = b.prefLabel.value.toLowerCase();
            return (la == lb) ? 0  :
                   (la < lb)  ? -1 : 1;
          });
          var ul_list = $("<ul>");
          $.each(concepts, function (index, data) {
            var link = $("<a>").attr("href", data.concept.value).html(data.prefLabel.value);
            var item = $("<li>").append(link);
            ul_list.append(item);
          })
        }
        var list = $("<div>").addClass("index_list").css("max-height", indexStartHeight+"px");
        var wrapper = $("<div>").addClass("index_wrapper");
        wrapper.append($("<h1>").html(character.toUpperCase()));
        wrapper.append(list);
        list.append(ul_list);
        content.html(wrapper);
        if (concepts.length > 30) {
          var more = $("<div>").addClass("more_less");
          more.html('<a class="more" onclick="moreIndex()">mehr</a>');
          content.append(more);
        }
        indexCache[character] = content.html();
        indexMinHeight = list.height()
      })
    }
  }
});

})(jQuery);

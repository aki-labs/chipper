// Copyright 2002-2013, University of Colorado Boulder

/**
 * String plugin, loads a string using a syntax like:
 * var title = require( 'string!JOHN_TRAVOLTAGE/johnTravoltage.name' );
 *
 * The reasons we need our own string plugin:
 * So we can only include the (possibly) strings that are needed for a sim
 * So we can enumerate all of the used strings, for purposed of a translation utility
 * For uniformity with image and audio plugin
 *
 * The plugin code itself is excluded from the build by declaring it as a stubModule
 *
 * TODO: Lump strings together into one script block--perhaps it would be readable by the translation utility and the runtime.  This could facilitate rewriting the html in place.
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  var text = require( 'text' );
  var _ = require( '../../sherpa/lodash-2.0.0.min' );
  var getProjectURL = require( '../../chipper/requirejs-plugins/getProjectURL' );

  var FALLBACK_LOCALE = 'en';

  var parse = (typeof JSON !== 'undefined' && typeof JSON.parse === 'function') ? JSON.parse : function( text ) { return eval( '(' + text + ')' ); };

  //Cache the loaded strings so they only have to be file.read once
  var cache = {};

  //Finish the build step (whether the specified strings were available or just the fallback strings were).
  var buildWithStrings = function( name, parsedStrings, onload, key ) {
    var locale = null;

    //During a build, iterate over the locales and provide the strings for each
    //Enumerate all of the strings used by the sim, with no false positives
    //TODO: A better way to do this without globals?  Perhaps the export value of this function?  Or attach to the config?
    //TODO: if we stick with globals, make sure the globalStrings array is clean (undefined) when we start and delete it when we are done with it.
    //TODO: make sure this string hasn't already been written (especially with a different value)
    if ( global.phet.localesToBuild.length === 1 ) {
      locale = global.phet.localesToBuild[0];
      global.phet.strings[locale][name] = parsedStrings[key];
      onload( null );
    }

    //Load files for all languages for postprocessing step
    else {
      for ( var i = 0; i < global.phet.localesToBuild.length; i++ ) {
        locale = global.phet.localesToBuild[i];

      }
    }
  };

  //When running in the browser, check to see if we have already loaded the specified file
  //Also parses it so that only happens once per file (instead of once per string key)
  function getWithCache( url, callback, errback, headers ) {

    //Check for cache hit
    if ( cache[url] ) {
      callback( cache[url] );
    }

    //Cache miss: load the file parse, enter into cache and return it
    else {
      text.get( url, function( loadedText ) {
        cache[url] = parse( loadedText );
        callback( cache[url] );
      }, errback, headers );
    }
  }

  return {
    load: function( name, parentRequire, onload, config ) {

      // Pull out the key, which is between the last slash and the first question mark of the 'name' parameter.
      var questionMarkIndex = name.lastIndexOf( '?' );
      var key = questionMarkIndex < 0 ? name.substring( name.lastIndexOf( '/' ) + 1 ) : name.substring( name.lastIndexOf( '/' ) + 1, questionMarkIndex );

      // Create the paths to the string files - primary and fallback.
      var project = name.substring( 0, name.indexOf( '/' ) );
      project = project.toLowerCase() === 'bam' ? 'build-a-molecule' :
                project.toLowerCase() === 'woas' ? 'wave-on-a-string' :
                project;
      var getPath = function( locale ) {return getProjectURL( name, parentRequire ) + 'strings/' + project.toLowerCase().split( '_' ).join( '-' ) + '-strings_' + locale + '.json';};
      var fallbackStringPath = getPath( FALLBACK_LOCALE );

      var locale;
      //Browser version first
      if ( !config.isBuild ) {

        //Read the locale from a query parameter, if it is there, or use english
        locale = window.phetcommon.getQueryParameter( 'locale' ) || config.phetLocale || 'en';
        var stringPath = getPath( locale );

        //In the browser, a query parameter overrides anything, to match the behavior of the chipper version (for dynamically substituting new strings like in the translation utility)
        var queryParameterValue = window.phetcommon.getQueryParameter( key );
        if ( queryParameterValue ) {
          onload( queryParameterValue )
        }
        else {
          //TODO: load & parse just once per file.  Could populate a cache from path=>parsedStrings, and use text.get as one branch of the cache code
          getWithCache( fallbackStringPath, function( parsedFallbackStrings ) {
              var fallback = parsedFallbackStrings[key] || key;

              // Now get the primary strings.
              getWithCache( stringPath, function( parsed ) {

                  // Combine the primary and fallback strings into one object hash.
                  var parsedStrings = _.extend( parsedFallbackStrings, parsed );
                  if ( parsedStrings[key] ) {
                    onload( parsedStrings[key] );
                  }
                  else {
                    console.log( 'string not found for key: ' + key );
                    onload( fallback );
                  }
                },
                //Error callback in the text! plugin.  Couldn't load the strings for the specified language, so use a fallback
                function() {

                  if ( !parsedFallbackStrings[key] ) {
                    //It would be really strange for there to be no fallback for a certain string, that means it exists in the translation but not the original English
                    console.log( 'no fallback for key:' + key );
                  }
                  //Running in the browser (dynamic requirejs mode) and couldn't find the string file.  Use the fallbacks.
                  console.log( "No string file provided for " + stringPath );
                  onload( fallback );
                },
                { accept: 'application/json' }
              )
            },
            onload.error,
            { accept: 'application/json' }
          )
        }
      }

      //For compiler time
      else {

        //Lookup all of the available translation files for the localesToBuild and the fallback string files

        //TODO: Cache by repo name
        var localesToLoad = global.phet.localesToBuild.slice();
        if ( localesToLoad.indexOf( FALLBACK_LOCALE ) < 0 ) {
          localesToLoad.push( FALLBACK_LOCALE );
        }
//        console.log( 'locales to load: ' + localesToLoad );

        var count = 0;
        var resourceHandled = function() {
          count++;
          if ( count >= localesToLoad.length ) {
            onload( null );
          }
        };
        for ( var i = 0; i < localesToLoad.length; i++ ) {
          (function( locale ) {

            var path = getPath( locale );

            //If we already loaded those strings and registered with global.phet.strings, no need to do so again
            if ( cache[path] ) {
              resourceHandled();
            }

            //If the file doesn't exist, move on to the next one
            else if ( !global.fs.existsSync( path ) ) {
              console.log( "File doesn't exist: ", path );
              resourceHandled();
            }

            //Load from the actual file
            else {
              text.get( path, function( stringFile ) {
                  var parsed = parse( stringFile );
                  global.phet.strings[locale][name] = parsed[key];
                  cache[path] = parsed;//It doesn't really matter what the right hand side is as long as it is truthy
                  resourceHandled();
                },
                onload.error,
                { accept: 'application/json' }
              )
            }
          })( localesToLoad[i] );
        }
      }
    },

    //Write code that will look up the string in the compiled sim.
    write: function( pluginName, moduleName, write ) {
      write( 'define("' + pluginName + '!' + moduleName + '",function(){return window.phetStrings.get(\"' + moduleName + '\");});\n' );
    }
  };
} );
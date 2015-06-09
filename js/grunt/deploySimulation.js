// Copyright 2002-2015, University of Colorado Boulder

/**
 * Deploy a simulation by sending a request to our build-server.
 *
 * @author Aaron Davis
 */

// modules
var querystring = require( 'querystring' );
var request = require( 'request' );

/**
 * @param grunt the grunt instance
 * @param isProduction true if deploying to figaro
 */
module.exports = function( grunt, isProduction ) {
  'use strict';

  /* jslint node: true */
  // allows "process" to pass lint instead of getting an undefined lint error
  var directory = process.cwd();
  var directoryComponents = directory.split( '/' );
  var sim = directoryComponents[ directoryComponents.length - 1 ];

  var dependencies = grunt.file.readJSON( 'build/dependencies.json' );
  var version = grunt.file.readJSON( 'package.json' ).version;

  var query = querystring.stringify( {
    'repos': JSON.stringify( dependencies ),
    'locales': JSON.stringify( [ 'en' ] ),
    'simName': sim,
    'version': version,
    'serverName': 'simian'
  } );

  var url = 'http://phet-dev.colorado.edu/deploy-html-simulation?' + query;

  var done = grunt.task.current.async();

  request( url, function( error, response, body ) {
    if ( !error && response.statusCode === 200 ) {
      grunt.log.writeln( 'sending request to: ' + url );
    }
    else {
      grunt.log.writeln( 'error: deploy failed' );
    }
    done();
  } );
};

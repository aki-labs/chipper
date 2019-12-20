// Copyright 2019, University of Colorado Boulder

/* eslint-disable */

/**
 * Prototyping for https://github.com/phetsims/chipper/issues/820
 *
 * @param {Object} grunt
 * @param {Object} gruntConfig
 */

'use strict';

const fs = require( 'fs' );
const grunt = require( 'grunt' );

const replace = ( str, search, replacement ) => {
  return str.split( search ).join( replacement );
};

const migrateFile = async ( repo, relativeFile ) => {
  if ( relativeFile.endsWith( '/PhetioIDUtils.js' ) ) {
    return;
  }
  if ( relativeFile.endsWith( '/copyWithSortedKeys.js' ) ) {
    return;
  }
  console.log( repo, relativeFile );
  const path = '../' + repo + '/' + relativeFile;
  let contents = fs.readFileSync( path, 'utf-8' );
  contents = replace( contents, '= require( \'string!', '= (\'' );
  contents = replace( contents, '= require( \'ifphetio!', '= function(){return function(){ return function(){}; };}; // ' );
  contents = replace( contents, 'require( \'mipmap!BRAND/logo.png\' )', 'require( \'BRAND/../images/logo.png\' ).default' );
  contents = replace( contents, 'require( \'mipmap!BRAND/logo-on-white.png\' )', 'require( \'BRAND/../images/logo-on-white.png\' ).default' );
  contents = replace( contents, 'require( \'image!EXAMPLE_SIM/barMagnet.png\' )', 'require( \'EXAMPLE_SIM/../images/barMagnet.png\' ).default' );
  contents = replace( contents, 'require( \'mipmap!JOIST/keyboard-icon-on-white.png\' )', 'require( \'JOIST/../images/keyboard-icon-on-white.png\' ).default' );
  contents = replace( contents, 'require( \'mipmap!JOIST/keyboard-icon.png\' )', 'require( \'JOIST/../images/keyboard-icon.png\' ).default' );
  contents = replace( contents, 'require( \'sound!TAMBO/empty_apartment_bedroom_06_resampled.mp3\' )', 'require( \'TAMBO/../sounds/empty_apartment_bedroom_06_resampled.mp3\' ).default' );
  contents = replace( contents, 'require( \'sound!TAMBO/short-silence.wav\' )', 'require( \'TAMBO/../sounds/short-silence.wav\' ).default' );
  contents = replace( contents, 'require( \'sound!TAMBO/reset-all.mp3\' )', 'require( \'TAMBO/../sounds/reset-all.mp3\' ).default' );
  contents = replace( contents, 'require( \'sound!TAMBO/general-button-v4.mp3\' )', 'require( \'TAMBO/../sounds/general-button-v4.mp3\' ).default' );
  contents = replace( contents, 'assert && assert( Array.isArray( brightIconMipmap ), \'icon must be a mipmap\' );', '//assert && assert( Array.isArray( brightIconMipmap ), \'icon must be a mipmap\' );' );
  contents = replace( contents, 'assert && assert( Array.isArray( brightLogoMipmap ), \'logo must be a mipmap\' );', '// assert && assert( Array.isArray( brightLogoMipmap ), \'logo must be a mipmap\' );' );
  contents = replace( contents, 'brightIconMipmap[ 0 ].height', '108' );
  contents = replace( contents, 'brightLogoMipmap[ 0 ].height', '108' );

  contents = replace( contents, `  // text
  const packageString = require( 'text!REPOSITORY/package.json' );

  // constants
  const packageJSON = JSON.parse( packageString ); // Tandem can't depend on joist, so cannot use packageJSON module`, `const packageJSON = require('REPOSITORY/package.json');` );

  contents = replace( contents, `  // modules
  const joist = require( 'JOIST/joist' );

  // strings
  const packageString = require( 'text!REPOSITORY/package.json' );

  const packageJSON = JSON.parse( packageString );

  joist.register( 'packageJSON', packageJSON );`, `const packageJSON = require( 'REPOSITORY/package.json' );` );

  contents = replace( contents, `define( require => {`, `//define( require => {` );

  if ( !contents.endsWith( '} )();' ) ) {
    const lastIndex = contents.lastIndexOf( '} );' );
    contents = contents.substring( 0, lastIndex ) + '//' + contents.substring( lastIndex );
  }

  const returnInherit = contents.lastIndexOf( 'return inherit( ' );
  if ( returnInherit >= 0 ) {
    contents = replace( contents, `return inherit( `, `export default inherit( ` );
  }

  const lastReturn = contents.lastIndexOf( 'return ' );
  if ( lastReturn >= 0 && returnInherit === -1 ) {
    contents = contents.substring( 0, lastReturn ) + 'export default ' + contents.substring( lastReturn + 'return '.length );
  }

  // contents = replace(contents,`return inherit( Node, ScreenView, {`,`export default inherit( Node, ScreenView, {`);
  // contents = replace(contents,`export default Math.min( width / this.layoutBounds.width, height / this.layoutBounds.height );`,`return Math.min( width / this.layoutBounds.width, height / this.layoutBounds.height );`);

  // const Namespace = require( 'PHET_CORE/Namespace' );
  contents = replace( contents, `const Namespace = require( 'PHET_CORE/Namespace' );`, `import Namespace from 'PHET_CORE/Namespace'` );

  let lines = contents.split( /\r?\n/ );
  lines = lines.map( line => {
    // return 'hello ' + line;
    if ( line.trim().startsWith( 'const ' ) && line.indexOf( ' = require( ' ) >= 0 ) {
      // const Bounds2 = require( 'DOT/Bounds2' );
      // becomes
      // import Bounds2 from 'DOT/Bounds2';
      line = replace( line, 'const ', 'import ' );
      line = replace( line, ' = require( ', ' from ' );
      line = replace( line, '\' );', '\';' );
    }
    return line;
  } );
  contents = lines.join( '\n' );

  contents = replace( contents, `return inherit;`, `export default inherit;` );
  contents = replace( contents, `' ).default;`, `';` );

  // contents = replace(contents,`from 'AXON/`,`from '/axon/js/`);
  // contents = replace(contents,`from 'BRAND/`,`from '/brand/phet/js/`);
  // contents = replace(contents,`from 'DOT/`,`from '/dot/js/`);
  // contents = replace(contents,`from 'EXAMPLE_SIM/`,`from '/example-sim/js/`);
  // contents = replace(contents,`from 'JOIST/`,`from '/joist/js/`);
  // contents = replace(contents,`from 'KITE/`,`from '/kite/js/`);
  // contents = replace(contents,`from 'PHETCOMMON/`,`from '/phetcommon/js/`);
  // contents = replace(contents,`from 'PHET_CORE/`,`from '/phet-core/js/`);
  // contents = replace(contents,`from 'PHET_IO/`,`from '/phet-io/js/`);
  // contents = replace(contents,`from 'REPOSITORY/`,`from '/example-sim/js/`);
  // contents = replace(contents,`from 'SCENERY/`,`from '/scenery/js/`);
  // contents = replace(contents,`from 'SCENERY_PHET/`,`from '/scenery-phet/js/`);
  // contents = replace(contents,`from 'SUN/`,`from '/sun/js/`);
  // contents = replace(contents,`from 'TAMBO/`,`from '/tambo/js/`);
  // contents = replace(contents,`from 'TANDEM/`,`from '/tandem/js/`);
  // contents = replace(contents,`from 'UTTERANCE_QUEUE/`,`from '/utterance-queue/js/`);

  // AXON
  // BRAND
  // DOT
  // EXAMPLE_SIM
  // JOIST
  // KITE
  // PHETCOMMON
  // PHET_CORE
  // PHET_IO
  // REPOSITORY
  // SCENERY
  // SCENERY_PHET
  // SUN
  // TAMBO
  // TANDEM
  // UTTERANCE_QUEUE

  // : '../../axon/js',
  //   : '../../brand/' + phet.chipper.brand + '/js',
  //   : '../../dot/js',
  //   : '.',
  //   : '../../joist/js',
  //   : '../../kite/js',
  //   : '../../phetcommon/js',
  //   : '../../phet-core/js',
  //   : '../../phet-io/js',
  //   : '..',
  //   : '../../scenery/js',
  //   : '../../scenery-phet/js',
  //   : '../../sun/js',
  //   : '../../tambo/js',
  //   : '../../tandem/js',
  //   : '../../utterance-queue/js'

  fs.writeFileSync( path, contents, 'utf-8' );
};

module.exports = function( repo, cache ) {

  // const repos = fs.readFileSync( '../perennial/data/migrate-repos', 'utf-8' ).trim().split( /\r?\n/ ).map( sim => sim.trim() );
  const repos = `axon
brand
dot
joist
kite
phetcommon
phet-core
phet-io
example-sim
scenery
scenery-phet
sun
tambo
tandem
utterance-queue`.trim().split( /\r?\n/ ).map( sim => sim.trim() );
  repos.forEach( ( repo, index ) => {

    console.log( index + '/' + repos.length );

    let relativeFiles = [];
    grunt.file.recurse( `../${repo}`, ( abspath, rootdir, subdir, filename ) => {
      relativeFiles.push( `${subdir}/${filename}` );
    } );
    relativeFiles = relativeFiles.filter( file => file.startsWith( 'js/' ) ||

                                                  // that's for brand
                                                  file.startsWith( 'phet/js' ) );

    relativeFiles.forEach( ( rel, i ) => {
      console.log( '    ' + i + '/' + relativeFiles.length );
      migrateFile( repo, rel );
    } );
  } );
};
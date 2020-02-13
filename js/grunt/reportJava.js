// Copyright 2015-2020, University of Colorado Boulder
/* eslint-disable */ // It's a prototype

/**
 * It's a prototype, enter at your own peril
 * @author Sam Reid
 */
'use strict';

// const ChipperConstants = require( '../common/ChipperConstants' );
// const getLicenseEntry = require( '../common/getLicenseEntry' );
// const getPhetLibs = require( '../grunt/getPhetLibs' );
// const grunt = require( 'grunt' );
const fs = require( 'fs' );
const path = require( 'path' );
const fse = require( 'fs-extra' );//eslint-disable-line

const PropertiesReader = require( 'properties-reader' ); //eslint-disable-line

// const root = '/Users/samreid/phet-svn-trunk/simulations-java';

// const path = require( 'path' );

const reportProject = ( root, buildFilePath, out ) => {

  console.log( 'REPORTING FOR ' + buildFilePath );
  // const f = grunt.file.read( path );
  // console.log( f );

  const properties = PropertiesReader( buildFilePath );
  const data = properties.get( 'project.depends.data' );
  const source = properties.get( 'project.depends.source' );
  // console.log( source );
  const lib = properties.get( 'project.depends.lib' ); // could be jar files or other projects
  if ( source ) {
    source.split( ':' ).map( s => s.trim() ).filter( s => s.length > 0 ).forEach( src => {
      // console.log( src );
      const absSrc = `${path.dirname( buildFilePath )}/${src}`;
      out.src = out.src || [];
      if ( out.src.indexOf( absSrc ) === -1 ) {
        out.src.push( absSrc );
      }
    } );
  }

  if ( data ) {
    data.split( ':' ).map( s => s.trim() ).filter( s => s.length > 0 ).forEach( datum => {
      // console.log( datum );
      const absDatum = `${path.dirname( buildFilePath )}/${datum}`;
      out.data = out.data || [];
      if ( out.data.indexOf( absDatum ) === -1 ) {
        out.data.push( absDatum );
      }
    } );
  }

  // console.log( data, source, lib );

  const libs = lib.replace( ':', ' ' ).split( ' ' ).map( s => s.trim() ).filter( s => s.length > 0 );
  // console.log( libs );

  libs.forEach( lib => {
      // console.log( lib );
      if ( lib.endsWith( '.jar' ) ) {
        out.jars = out.jars || [];

        if ( lib.indexOf( '/' ) === -1 || lib === 'lib/jcommon.jar' || lib === 'lib/jfreechart.jar' ) { // relative
          const absDatum = `${path.dirname( buildFilePath )}/${lib}`;
          if ( out.jars.indexOf( absDatum ) === -1 ) {
            out.jars.push( absDatum );
          }
        }
        // console.log( 'FOUND JAR ' + lib );
        else { // absolute, look in contrib
          const absLib = `${root}/contrib/${lib}`;
          if ( out.jars.indexOf( absLib ) === -1 ) {
            out.jars.push( absLib );
          }
        }

      }
      else {
        const commonDir = `${root}/common/${lib}/${lib}-build.properties`;
        const contribDir = `${root}/contrib/${lib}/${lib}-build.properties`;
        // console.log( 'searching for: ' + commonDir );
        if ( fs.existsSync( commonDir ) ) {
          // console.log( 'FOUND COMMON' );
          reportProject( root, commonDir, out );

        }
        else if ( fs.existsSync( contribDir ) ) {
          // console.log( 'FOUND CONTRIB' );
          reportProject( root, contribDir, out );
        }
        else {
          console.log( 'NOT FOUND:' + lib );
        }
      }
    }
  );
};

/**
 * @param {string} repo
 */
module.exports = ( root, build, out ) => {
  // const path = '/Users/samreid/phet-svn-trunk/simulations-java/simulations/sugar-and-salt-solutions/sugar-and-salt-solutions-build.properties';

  const data = {};
  reportProject( root, build, data );

  console.log( data );

  const SRC_OUT = `${out}/src`;
  const DATA_OUT = `${out}/data`;
  const LIB_OUT = `${out}/lib`;

  try {
    fs.mkdirSync( out );
  }
  catch( e ) {
  }
  try {

    fs.mkdirSync( SRC_OUT );
  }
  catch( e ) {}
  try {fs.mkdirSync( DATA_OUT );}
  catch( e ) {}
  try {

    fs.mkdirSync( LIB_OUT );
  }
  catch( e ) {}

  data.src.forEach( src => {
    fse.copySync( src, SRC_OUT );
  } );
  data.data.forEach( datum => {
    fse.copySync( datum, DATA_OUT );
  } );
  data.jars.forEach( jar => {
    console.log( 'copying ' + jar );
    fse.copySync( jar, `${LIB_OUT}/${jar.substring( jar.lastIndexOf( '/' ) + 1 )}` );
  } );
};

// grunt report-java --src=/Users/samreid/phet-svn-trunk/simulations-java/simulations/sugar-and-salt-solutions/sugar-and-salt-solutions-build.properties --root=/Users/samreid/phet-svn-trunk/simulations-java --dst=/Users/samreid/github/tmp
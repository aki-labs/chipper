// Copyright 2021, University of Colorado Boulder
const fs = require( 'fs' );
const phetioCompareAPIs = require( './phetioCompareAPIs' );
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const jsondiffpatch = require( '../../../sherpa/lib/jsondiffpatch-v0.3.11.umd' ).create( {} );
const assert = require( 'assert' );

const API_DIR = '../phet-io/api';

/**
 * Compare two sets of APIs using phetioCompareAPIs.
 *
 * @param {string[]} repos
 * @param {Object} proposedAPIs - map where key=repo, value=proposed API for that repo
 * @param {Object} [options]
 * @returns {Promise.<void>}
 */
module.exports = async ( repos, proposedAPIs, options ) => {
  options = _.extend( {
    delta: false,
    compareBreakingAPIChanges: false
  }, options );

  repos.forEach( repo => {

    const packageObject = JSON.parse( fs.readFileSync( `../${repo}/package.json`, 'utf8' ) );
    const phetioSection = packageObject.phet[ 'phet-io' ] || {};

    // Fails on missing file or parse error.
    const referenceAPI = JSON.parse( fs.readFileSync( `${API_DIR}/${repo}.json`, 'utf8' ) );
    const proposedAPI = proposedAPIs[ repo ];

    const comparisonData = phetioCompareAPIs( referenceAPI, proposedAPI, _, assert, {
      compareBreakingAPIChanges: options.compareBreakingAPIChanges,
      compareDesignedAPIChanges: !!phetioSection.compareDesignedAPIChanges // determined from the package.json flag
    } );

    if ( comparisonData.breakingProblems.length ) {
      console.log( `${repo} BREAKING PROBLEMS` );
      console.log( comparisonData.breakingProblems.join( '\n' ) );
      console.log( '\n' );
    }

    if ( comparisonData.designedProblems.length ) {
      console.log( `${repo} DESIGN PROBLEMS` );
      console.log( comparisonData.designedProblems.join( '\n' ) );
      console.log( '\n' );
    }

    if ( options.delta ) {
      const delta = jsondiffpatch.diff( referenceAPI, proposedAPI );
      if ( delta ) {
        console.log( JSON.stringify( delta, null, 2 ) );
      }
    }
  } );
};
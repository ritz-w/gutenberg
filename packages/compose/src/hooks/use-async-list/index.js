/**
 * WordPress dependencies
 */
import { useEffect, useReducer } from '@wordpress/element';
import { createQueue } from '@wordpress/priority-queue';

/**
 * Returns the first items from list that are present on state.
 *
 * @param {Array} list  New array.
 * @param {Array} state Current state.
 * @param {number?} minimum Minimum list of items to return
 * @return {Array} First items present iin state.
 */
function getFirstItemsPresentInState( list, state, minimum = 0 ) {
	let firstItems = [];

	for ( let i = 0; i < list.length; i++ ) {
		const item = list[ i ];
		if ( ! state.includes( item ) ) {
			break;
		}

		firstItems.push( item );
	}

	firstItems = firstItems.concat( list.slice( firstItems.length, minimum ) );

	return firstItems;
}

/**
 * Reducer keeping track of a list of appended items.
 *
 * @param {Array}  state  Current state
 * @param {Object} action Action
 *
 * @return {Array} update state.
 */
function listReducer( state, action ) {
	if ( action.type === 'reset' ) {
		return action.list;
	}

	if ( action.type === 'append' ) {
		return [ ...state, ...action.items ];
	}

	return state;
}

/**
 * React hook returns an array which items get asynchronously appended from a source array.
 * This behavior is useful if we want to render a list of items asynchronously for performance reasons.
 *
 * @param {Array}  list   Source array.
 * @param {Object} config Configuration of the async list.
 * @return {Array} Async array.
 */
function useAsyncList( list, { increment = 1 } = {} ) {
	const [ current, dispatch ] = useReducer( listReducer, [] );

	useEffect( () => {
		// On reset, we keep the first items that were previously rendered.
		const firstItems = getFirstItemsPresentInState(
			list,
			current,
			increment
		);
		dispatch( {
			type: 'reset',
			list: firstItems,
		} );
		const asyncQueue = createQueue();
		const append = ( index ) => () => {
			if ( list.length <= index ) {
				return;
			}
			dispatch( {
				type: 'append',
				items: list.slice( index, index + increment ),
			} );
			asyncQueue.add( {}, append( index + increment ) );
		};
		asyncQueue.add( {}, append( firstItems.length ) );

		return () => asyncQueue.reset();
	}, [ list ] );

	return current;
}

export default useAsyncList;
import React from 'react';

/*****************
 *  TODO: This component would likely be more useful if there was an HOC export as well
 *  TODO: list interface object might need to change, depending on how this will be used
 *****************/

// IWDPaginator -- a class to do client-side pagination
// Provide an array as props.list to paginate items in list

// expects props:
//		listName - name for object that is injected into children props
//		list - array containing full list
//		windowSize - how many items from list in each page

// Render list using props.children props.render
//		props.children
//			OR
//		props.render()

// Injects list and related props:
//	[listName]	{
//		list: [], 							// current paginated list
//		endOfList: true/false 				// Boolean to indicate whether at end of list
//		nextPage(), 						// get next window
//		prevPage(), 						// get prev window
//	}

// Two ways to use:
// 1 - provide render({ [listName]: injected_props }) prop. It gets same props as children would in an object as argument
// 2 - provide children element(s), which will get page injected as props[listName]

export class IWDPaginator extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			windowStart: 0,
		}
	}

	updateWindow(direction) {
		let adjustment = this.props.windowSize;
		if (direction === 'previous') {
			adjustment = - adjustment;
		}
		let newVal = adjustment + this.state.windowStart;

		if (newVal < 0 || newVal > this.props.list.length) {
			// don't go past end of list
			return;
		}

		return new Promise((resolve) => this.setState({ windowStart: newVal }, resolve));
	}

	render() {
		let {
			list=[],
			listName='list',
			children=null,
			render=null,
			windowSize
		} = this.props;

		let { windowStart } = this.state;
		let windowedList = list.slice(windowStart, windowStart + windowSize);
		let endOfList = (windowStart + windowSize >= list.length);

		let propsToInject = {
			[listName]: {
				list: windowedList,
				endOfList, // indicates whether there is a next page.
				page: 0, // not implemented
				nextPage: this.updateWindow.bind(this,'next'),
				prevPage: this.updateWindow.bind(this,'previous')
			}
		}

		// call client rendering code with current window of data
		if (typeof render === 'function') {
			// call render function for each item in list
			return (
				<React.Fragment>
					{render(propsToInject)}
				</React.Fragment>
			)
		} else {
			// inject 'windowedList' into children's props as listName
			return (
				<React.Fragment>
					{React.Children.map(children, (child) => {
						let { children:childChildren, props:childProps} = child;
						return React.cloneElement(child, {...propsToInject, ...childProps}, childChildren);
					})}
				</React.Fragment>
			)
		}
	}
}

IWDPaginator.defaultProps = {
	windowSize: 16,
	list: [],
	render: null,
	children: null,
	onNext: (_) => (_),
	onPrevious: (_) => (_)
}

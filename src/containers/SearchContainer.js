import React  from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as actions from '../actions'

import { SearchBox, RecentSearch, GithubLink, Footer } from 'components'

class SearchContainer extends React.Component {
  test () {
    this.props.actions.GET_SEARCH_RESULTS('周', 'artist')
    console.log(this.props.suggestions)
  }

  render () {
    const recents = [{id: 0, name: 'test0'}, {id: 1, name: 'test1'}, {id: 2, name: 'test2'}, {id: 3, name: 'test3'}]

    return (
      <div className="search-wrapper">
        <header>Mufly</header>
        <GithubLink />
        <h1>Discover new artists through an infinite suggestion graph.</h1>
        <h3>Enter the name of an artist you like:</h3>
        <SearchBox requestSearchSuggestions={::this.test}/>
        <RecentSearch recents={recents}/>
        <Footer />
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    suggestions: state.suggestions
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators(actions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchContainer)

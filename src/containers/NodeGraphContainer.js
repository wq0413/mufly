import React  from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as actions from '../actions'

import { browserHistory } from 'react-router'
import { isEmpty } from 'lodash'
import AUTH from 'helpers/auth'

import {Avatar, Back, NodeGraph, Samples, GithubLink, Footer, Modal } from 'components'
import Sentry from 'react-activity/lib/Sentry'

class NodeGraphContainer extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      past: [],
      present: {},
      future: []
    }
    // this.animateReorder = this.animateReorder.bind(this)
  }

  componentWillMount () {
    let id = this.props.routeParams.id
    this.getArtistsAndTracks(id)
  }

  componentWillReceiveProps (nextProps) {
    // If the routeParams changes, then we call func to get API
    if (this.props.routeParams.id !== nextProps.routeParams.id) {
      this.getArtistsAndTracks(nextProps.routeParams.id)
    }

    // If the artist nodes in page need change
    if (!nextProps.loading && this.props.artists !== nextProps.artists) {
      this.rmFutureNodes(nextProps)

      setTimeout(() => {
        this.adjustPresentNode(nextProps)
      }, 800)

      setTimeout(() => {
        this.addFutureNodes(nextProps)
      }, 1500)
    }
  }

  // 1 - Remove future nodes, past node if needed. (Do not need when first mount)
  rmFutureNodes (nextProps) {
    if (this.state && !isEmpty(this.state.future)) {
      this.setState({
        future: this.state.future.map((artist) => {
          return artist.id === nextProps.artists.present.id ? artist : {}
        })
      })
    }
  }

  // 2 - Move present to past or future
  //   - Move new present node to middle, if needed
  adjustPresentNode (nextProps) {
    if (this.state && !isEmpty(this.state.present)) {
      // - present need go to past, future node comes to present
      if (!isEmpty(nextProps.artists.past) && this.state.present.id === nextProps.artists.past[nextProps.artists.past.length - 1].id) {
        let past = this.state.past
        past.push(this.state.present)

        this.setState({
          past: past,
          future: []
        })
      }

      // - present need go to future, past node comes to present
      else if (nextProps.artists.future.some((artist) => {
          return artist.id === this.state.present.id
        })) {

        let past = this.state.past
        past.pop()

        this.setState({
          past: past,
          future: nextProps.artists.future.map((artist, index) => {
            return artist.id === this.state.present.id ? artist : ((artist) => {
              artist.isShow = false
              return artist
            })(nextProps.artists.future[index])
          })
        })

        console.log(this.state.future)
      }
    }

    this.setState({
      present: nextProps.artists.present
    })
  }

  // 3 - Add new future nodes
  addFutureNodes (nextProps) {
    let future
    if (this.state && this.state.future.length) {
      future = this.state.future.map((artist, index) => {
        return artist.isShow === true ? artist : ((artist) => {
          artist.isShow = true
          return artist
        })(nextProps.artists.future[index])
      })
    } else {
      future = nextProps.artists.future
    }

    this.setState({
      future: future
    })
  }

  componentWillUnmount () {
    this.props.actions.CLEAR_PAST_ARTISTS()
  }

  getNodeAndLines (props) {
    return {
      nodes: [
        !isEmpty(props.past[props.past.length - 1]) ? {id: props.past[props.past.length - 1].id, name: props.past[props.past.length - 1].name, region: 'PAST', regionIndex: 1} : {},
        {id: props.present.id, name: props.present.name, region: 'PRESENT', regionIndex: 1},
        !isEmpty(props.future[0]) ? {id: props.future[0].id, name: props.future[0].name, region: 'FUTURE', regionIndex: 0} : {},
        !isEmpty(props.future[1]) ? {id: props.future[1].id, name: props.future[1].name, region: 'FUTURE', regionIndex: 1} : {},
        !isEmpty(props.future[2]) ? {id: props.future[2].id, name: props.future[2].name, region: 'FUTURE', regionIndex: 2} : {}
      ],
      lines: [
        !isEmpty(props.past[props.past.length - 1]) ? {from: props.past[props.past.length - 1].id, to: props.present.id} : {},
        !isEmpty(props.future[0]) ? {from: props.present.id, to: props.future[0].id} : {},
        !isEmpty(props.future[1]) ? {from: props.present.id, to: props.future[1].id} : {},
        !isEmpty(props.future[2]) ? {from: props.present.id, to: props.future[2].id} : {}
      ]
    }
  }

  getPlaying (id) {
    this.props.actions.GET_PLAYING_TRACK(id)
  }

  getArtistsAndTracks (id, ignoreId) {
    //HACK: Can never let the same artist exist in past and future
    let pastId = this.props.artists.past[this.props.artists.past.length - 1] ? this.props.artists.past[this.props.artists.past.length - 1].id : undefined

    let calcId = ignoreId ? ignoreId : pastId

    this.props.actions.GET_PRESENT_ARTIST(id, calcId)
    this.props.actions.GET_TOP_TRACKS(id)
  }

  isTokenValid () {
    const authToken = JSON.parse(localStorage.getItem('AuthToken'))

    // If there is one and it is valid, do not need do anything
    if (authToken && (Date.now() < authToken.endTime)) {
      return true
    } else {
      return false
    }
  }

  nodeClickHandler (id) {
    if (this.isTokenValid()) {
      // If click past node
      let pastId = this.props.artists.past[this.props.artists.past.length - 1] ? this.props.artists.past[this.props.artists.past.length - 1].id : undefined
      if (pastId === id) {
        this.props.actions.RM_PAST_ARTIST()
        browserHistory.push(`/artist/${id}`)
        return
      }

      // If click future node
      let artist = this.props.artists.present
      // if (! this.props.artists.past.some((past) => {
      //     return past.id === artist.id
      //   })) {
      //   this.props.actions.ADD_PAST_ARTIST(artist)
      // }

      this.props.actions.ADD_PAST_ARTIST(artist)

      browserHistory.push(`/artist/${id}`)
    } else {
      console.log('[INFO] ', 'Request - Get a new token ', new Date().toLocaleString())
      this.props.actions.START_REQUESTING_PROCESS()
      AUTH.getAuth().then(res => {
        if (res.statusText === 'OK') {
          const expires_in_ms = (res.data.expires_in - 20) * 1000
          const endTime = Date.now() + expires_in_ms

          const token = {
            endTime,
            ...res.data
          }

          localStorage.setItem('AuthToken', JSON.stringify(token))
          console.log('[INFO] ', 'Request - Done ', new Date().toLocaleString())
          this.props.actions.END_REQUESTING_PROCESS()
        }
      })
    }
  }

  render () {
    return (
      <div className="node-graph-wrapper">
        <Back />
        <GithubLink />
        { !isEmpty(this.state.present) &&
          <Avatar artistAvatarUrl={this.props.artists.present.image}
                artistVisible={true}
        />
        }

        { this.props.tracks.length != 0 && !this.props.loading &&
          <Samples tracks={this.props.tracks}
                 playing={this.props.playing}
                 playHandler={::this.getPlaying}
                 visible={true}
        />
        }

        { !isEmpty(this.state.present) &&
          <NodeGraph nodes={this.getNodeAndLines(this.state).nodes} lines={this.getNodeAndLines(this.state).lines} nodeClickHandler={::this.nodeClickHandler}/>
        }

        { this.props.loading &&
          <Sentry className='node-graph-loading' color="#727981" size={32} speed={0.9}/>
        }

        <Footer />

        { this.props.requesting &&
          <Modal />
        }
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    artists: state.artists,
    tracks: state.tracks,
    loading: state.loading,
    playing: state.playing,
    requesting: state.requesting
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
)(NodeGraphContainer)

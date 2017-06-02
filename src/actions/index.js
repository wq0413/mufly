import API from 'helpers/api'

export const GET_SEARCH = (suggestions) => {
  return {
    type: 'GET_SEARCH',
    suggestions
  }
}

export const CLEAR_SEARCH = (suggestions) => {
  return {
    type: 'CLEAR_SEARCH',
    suggestions
  }
}

export const START_LOADING = (loading) => {
  return {
    type: 'START_LOADING',
    loading
  }
}

export const END_LOADING = (loading) => {
  return {
    type: 'END_LOADING',
    loading
  }
}

export const GET_PRESENT = (artists) => {
  return {
    type: 'GET_PRESENT',
    artists
  }
}

export const GET_TRACKS = (tracks) => {
  return {
    type: 'GET_TRACKS',
    tracks
  }
}

export const GET_PLAYING = (playing) => {
  return {
    type: 'GET_PLAYING',
    playing
  }
}

export const GET_SEARCH_RESULTS = (q, type) => {
  return (dispatch => {
    dispatch(START_LOADING())
    API.search(q, type).then(res => {
      if (res.statusText === 'OK') {
        dispatch(GET_SEARCH(res.data.artists.items))
        dispatch(END_LOADING())
      }
    })
  })
}

export const CLEAR_SEARCH_RESULTS = () => {
  return (dispatch => {
    dispatch(CLEAR_SEARCH())
    dispatch(END_LOADING())
  })
}

export const GET_PRESENT_ARTIST = (id) => {
  let artists = {
    past: [],
    present: {},
    future: []
  }

  return (dispatch => {
    API.artists(id).then(res => {
      if (res.statusText === 'OK') {
        artists.present = {id: id, name: res.data.name, image: res.data.images[0].url}
        API.releatedArtists(id).then(res => {
          if (res.statusText === 'OK') {
            if (res.data.artists && res.data.artists.length >= 3) {
              for (let i = 0; i < 3; i++) {
                let artist = {id: res.data.artists[i].id, name: res.data.artists[i].name, image: res.data.artists[i].images[0].url}
                artists.future.push(artist)
              }
              dispatch(GET_PRESENT(artists))
            }
          }
        })
      }
    })
  })
}

export const GET_TOP_TRACKS = (id) => {
  return (dispatch => {
    API.topTracks(id).then(res => {
      if (res.statusText === 'OK') {
        if (res.data.tracks && res.data.tracks.length >= 3) {
          let tracks = []
          for (let i = 0; i < 3; i++) {
            let track = {id: res.data.tracks[i].id, name: res.data.tracks[i].name, url: res.data.tracks[i].preview_url}
            tracks.push(track)
          }
          dispatch(GET_TRACKS(tracks))
        }
      }
    })
  })
}

export const GET_PLAYING_TRACK = (id) => {
  return (dispatch => {
    dispatch(GET_PLAYING(id))
  })
}
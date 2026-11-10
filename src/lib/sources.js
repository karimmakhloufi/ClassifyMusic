// Deezer editorial "decade hits" playlists. The decade range is used to sanity-check
// release years (a song from the 80s playlist dated 2009 is a reissue date).
export const DECADES = [
  { key: '60s', label: '60s', playlistId: '620264073', decade: { from: 1960, to: 1969 } },
  { key: '70s', label: '70s', playlistId: '1470022445', decade: { from: 1970, to: 1979 } },
  { key: '80s', label: '80s', playlistId: '867825522', decade: { from: 1980, to: 1989 } },
  { key: '90s', label: '90s', playlistId: '878989033', decade: { from: 1990, to: 1999 } },
  { key: '00s', label: '2000s', playlistId: '1977689462', decade: { from: 2000, to: 2009 } },
  { key: '10s', label: '2010s', playlistId: '14917741483', decade: { from: 2010, to: 2019 } },
  { key: '20s', label: '2020s', playlistId: '13650084141', decade: { from: 2020, to: 2029 } },
];

// Other playlists mixing several eras: no decade check, so their songs need a
// MusicBrainz match to be used (see releaseYear.js).
export const MIXED = [
  // "Blind Test années 60 70 80 90 2000 2010 2020" (~2000 tracks, ~1300 with a preview)
  { key: 'blindtest', label: 'Blind Test 60s–2020s', playlistId: '12958272963', decade: null },
];

/** Every playlist the game draws songs from. */
export const SOURCES = [...DECADES, ...MIXED].map(({ playlistId, decade }) => ({ playlistId, decade }));

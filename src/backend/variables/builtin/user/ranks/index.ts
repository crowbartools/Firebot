import viewerRank from './viewer-rank';
import viewerNextRank from './viewer-next-rank';
import viewerRankValue from './rank-value';
import viewerRankValueDescription from './rank-value-description';
import rankLadder from './rank-ladder';
import rankLadderMode from './rank-ladder-mode';
import newRank from './new-rank';
import previousRank from './previous-rank';
import isPromotion from './is-promotion';
import isDemotion from './is-demotion';
import viewersInRankArray from './viewers-in-rank-array';
import viewerNamesInRank from './viewer-names-in-rank';
import viewerHasRank from './viewer-has-rank';

export default [
    viewerRank,
    viewerNextRank,
    viewerRankValue,
    viewerRankValueDescription,
    rankLadder,
    rankLadderMode,
    viewersInRankArray,
    viewerNamesInRank,
    viewerHasRank,
    // Viewer Rank Changed event
    newRank,
    previousRank,
    isPromotion,
    isDemotion
];
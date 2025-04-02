import arrayAdd from './array-add';
import arrayElement from './array-element';
import arrayFilter from './array-filter';
import arrayFind from './array-find';
import arrayFindIndex from './array-find-index';
import arrayFindWithNull from './array-find-with-null';
import arrayFrom from './array-from';
import arrayFuzzySearch from './array-fuzzy-search';
import arrayJoin from './array-join';
import arrayLength from './array-length';
import arrayRandomItem from './array-random-item';
import arrayRemove from './array-remove';
import arrayReverse from './array-reverse';
import arrayShuffle from './array-shuffle';
import arraySlice from './array-slice';

// Deprecated
import rawArrayAdd from './raw-array-add';
import rawArrayElement from './raw-array-element';
import rawArrayFilter from './raw-array-filter';
import rawArrayFind from './raw-array-find';
import rawArrayFindIndex from './raw-array-find-index';
import rawArrayFrom from './raw-array-from';
import rawArrayJoin from './raw-array-join';
import rawArrayLength from './raw-array-length';
import rawArrayRemove from './raw-array-remove';
import rawArrayReverse from './raw-array-reverse';
import rawArrayShuffle from './raw-array-shuffle';

export default [
    arrayAdd,
    arrayElement,
    arrayFilter,
    arrayFindIndex,
    arrayFind,
    arrayFindWithNull,
    arrayFrom,
    arrayFuzzySearch,
    arrayJoin,
    arrayLength,
    arrayRandomItem,
    arrayRemove,
    arrayReverse,
    arrayShuffle,
    arraySlice,

    // Deprecated
    rawArrayAdd,
    rawArrayElement,
    rawArrayFilter,
    rawArrayFindIndex,
    rawArrayFind,
    rawArrayFrom,
    rawArrayJoin,
    rawArrayLength,
    rawArrayRemove,
    rawArrayReverse,
    rawArrayShuffle
];
import {test} from '../../../util/test';
import {createMap as globalCreateMap} from '../../../util';
import VectorTileSource from '../../../../rollup/build/tsc/source/vector_tile_source';

function createMap(t, logoPosition, logoRequired) {
    return globalCreateMap(t, {
        style: {
            version: 8,
            sources: {
                'composite': createSource({
                    minzoom: 1,
                    maxzoom: 10,
                    attribution: "Mapbox",
                    tiles: [
                        "http://example.com/{z}/{x}/{y}.png"
                    ]
                }, logoRequired)
            },
            layers: []
        },
        logoPosition: logoPosition || undefined
    });
}

function createSource(options, logoRequired) {
    const source = new VectorTileSource('id', options, {send () {}});
    source.onAdd({
        _requestManager: {
            _skuToken: '1234567890123',
            canonicalizeTileset: tileJSON => tileJSON.tiles
        },
        transform: {angle: 0, pitch: 0, showCollisionBoxes: false},
        _getMapId: () => 1
    });
    source.on('error', (e) => {
        throw e.error;
    });
    const logoFlag = "maplibreLogo";
    source[logoFlag] = logoRequired === undefined ? true : logoRequired;
    return source;
}
test('LogoControl appears in bottom-left by default', (t) => {
    const map = createMap(t);
    map.on('load', () => {
        t.equal(map.getContainer().querySelectorAll(
            '.maplibregl-ctrl-bottom-left .maplibregl-ctrl-logo'
        ).length, 1);
        t.end();
    });
});

test('LogoControl appears in the position specified by the position option', (t) => {
    const map = createMap(t, 'top-left');
    map.on('load', () => {
        t.equal(map.getContainer().querySelectorAll(
            '.maplibregl-ctrl-top-left .maplibregl-ctrl-logo'
        ).length, 1);
        t.end();
    });
});

test('LogoControl is not displayed when the maplibreLogo property is false', (t) => {
    const map = createMap(t, 'top-left', false);
    map.on('load', () => {
        t.equal(map.getContainer().querySelectorAll('.maplibregl-ctrl-top-left > .maplibregl-ctrl')[0].style.display, 'none');
        t.end();
    });
});
test('LogoControl is not added more than once', (t) => {
    const map = createMap(t);
    const source = createSource({
        minzoom: 1,
        maxzoom: 10,
        attribution: "Mapbox",
        tiles: [
            "http://example.com/{z}/{x}/{y}.png"
        ]
    });
    map.on('load', () => {
        t.equal(map.getContainer().querySelectorAll('.maplibregl-ctrl-logo').length, 1, 'first LogoControl');
        map.addSource('source2', source);
        map.on('sourcedata', (e) => {
            if (e.isSourceLoaded && e.sourceId === 'source2' && e.sourceDataType === 'metadata') {
                t.equal(map.getContainer().querySelectorAll('.maplibregl-ctrl-logo').length, 1, 'only one LogoControl is added with multiple sources');
                t.end();
            }
        });
    });
});

test('LogoControl appears in compact mode if container is less then 250 pixel wide', (t) => {
    const map = createMap(t);
    const container = map.getContainer();

    Object.defineProperty(map.getCanvasContainer(), 'offsetWidth', {value: 255, configurable: true});
    map.resize();
    t.equal(container.querySelectorAll('.maplibregl-ctrl-logo:not(.maplibregl-compact)').length, 1);

    Object.defineProperty(map.getCanvasContainer(), 'offsetWidth', {value: 245, configurable: true});
    map.resize();
    t.equal(container.querySelectorAll('.maplibregl-ctrl-logo.maplibregl-compact').length, 1);

    t.end();
});

test('LogoControl has `rel` nooper and nofollow', (t) => {
    const map = createMap(t);

    map.on('load', () => {
        const container = map.getContainer();
        const logo = container.querySelector('.maplibregl-ctrl-logo');

        t.equal(logo.rel, 'noopener nofollow');

        t.end();
    });
});

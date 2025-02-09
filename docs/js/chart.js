import { removeWarning } from './utils.js';
import { allData } from './data/metrics.js';

removeWarning('old_browser_warning');

const chartConfig = {
    displayWidth: 1024,
    displayHeight: 768,
    displayPixelRatio: 1,
    metricsConfig: {
        maxAge: 24, // 2 years - beyond that it's just too old
        maxAuthors: 5, // i.e. if a file has 5 authors or more, it's ok
        maxLoc: 1000, // size of James' head times two
        maxIndent: 50,
        badColour: d3.rgb('#E60D0D'),
        goodColour: d3.rgb('#0E34E0'),
        neutralColour: d3.rgb('green'),
        defaultStrokeColour: d3.rgb('black'),
        lighterStrokeColour: d3.rgb('#4E4545'),
        // parentFillColour: d3.rgb('#7D7E8C'),
        parentFillColour: d3.rgb('#202020'),
    },
};

// use getIn for objects as well as immutable objects
function nestedGet(object, path) {
    if (Immutable.isImmutable(object)) {
        return Immutable.getIn(object, path);
    }
    let index = 0;
    const length = path.length;
    let o = object;

    while (o != null && index < length) {
        o = o[path[index++]];
    }
    return (index && index === length) ? o : undefined;
}

function rawLanguageDataFn(d) {
    // annoyingly, the original hierarchy isn't the same structure as what d3.hierarchy builds for nodes later
    return nestedGet(d, ['data', 'cloc', 'language']);
}

function languageDataFn(d) {
    return nestedGet(d, ['data', 'data', 'cloc', 'language']);
}

function addLanguagesFromNode(counts, node) {
    const language = rawLanguageDataFn(node);
    if (language !== undefined) {
        if (counts[language]) {
            counts[language] += 1;
        } else {
            counts[language] = 1;
        }
    }

    if (node.children !== undefined) {
        for (let child of node.children) {
            addLanguagesFromNode(counts, child);
        }
    }
}

function countLanguagesIn(data) {
    let counts = {};
    Object.entries(data).forEach(([_project, projectData]) => {
        addLanguagesFromNode(counts, projectData.rawData);
    });

    return counts;
}

function buildLanguageColours(languageCounts) {
    const languagesWithColours = Immutable.fromJS(Object.entries(languageCounts))
        .sortBy(([_k, v]) => -v)
        .map(([k, v], ix) => [k, Immutable.Map({ count: v, colour: d3.schemeCategory20[ix <= 19 ? ix : 19] })]);
    return Immutable.Map(languagesWithColours);
}

function ageMonthsDataFn(d) {
    let res = nestedGet(d, ['data', 'data', 'code-maat', 'ageMonths']);
    if (res === undefined) {
        res = nestedGet(d, ['data', 'data', 'code-maat', 'age-months']);
    }
    return res;
}

function authorsDataFn(d) {
    let res = nestedGet(d, ['data', 'data', 'code-maat', 'nAuthors']);
    if (res === undefined) {
        res = nestedGet(d, ['data', 'data', 'code-maat', 'n-authors']);
    }
    return res;
}

function locDataFn(d) {
    return nestedGet(d, ['data', 'data', 'cloc', 'code']);
}

function averageIndentDataFn(d) {
    return nestedGet(d, ['data', 'data', 'indents', 'percentiles', '50']);
}

function worstIndentDataFn(d) {
    return nestedGet(d, ['data', 'data', 'indents', 'percentiles', '95']);
}

function buildScaledNodeColourFn(dataFn, parentColour, defaultColour, colourScale) {
    return (d) => {
        if (d.children) {
            return parentColour;
        }
        const value = dataFn(d);

        return value === undefined ? defaultColour : colourScale(value);
    };
}

function zebraStrokeFnBuilder(config) {
    return (node) => {
        if (node.children) {
            if (node.depth % 2 === 0) {
                return config.defaultStrokeColour;
            } else {
                return config.lighterStrokeColour;
            }
        }
        return config.defaultStrokeColour;
    };
}

function buildColourStrategies(rootConfig, languageColours) {
    const config = rootConfig.metricsConfig; // TODO refactor this naming
    // const badGoodScale = d3.scaleLinear().range([config.badColour, config.goodColour]);
    const colourScale = d3.interpolateWarm;
    const goodestColour = colourScale(0);
    const baddestColour = colourScale(1);
    const goodBadScale = d3.scaleSequential(colourScale).clamp(true);
    const oneAuthorColour = goodBadScale(0.9); // it's pretty bad to have one author - but not as bad as 0
    const twoAuthorColour = goodBadScale(0.6);  // it's not great to have two authors - but not nearly as bad as 1
    const authorScale = d3.scaleLinear().range([baddestColour, oneAuthorColour, twoAuthorColour, goodestColour]);
    // const darkerBadGoodScale = d3.scaleLinear().range([config.badColour.darker(), config.goodColour.darker()]);

    const baseLocFillFn = buildScaledNodeColourFn(locDataFn,
        config.parentFillColour,
        config.neutralColour,
        goodBadScale.copy().domain([0, config.maxLoc]));

    const locFillFn = (d) => {
        const colour = baseLocFillFn(d);
        if (colour === baddestColour) {
            return 'url(#boicy)';
        }
        return colour;
    }


    return {
        age: {
            fillFn: buildScaledNodeColourFn(ageMonthsDataFn,
                config.parentFillColour,
                baddestColour,
                goodBadScale.copy().domain([0, config.maxAge])),
            strokeFn: zebraStrokeFnBuilder(config),
        },
        authors: {
            fillFn: buildScaledNodeColourFn(authorsDataFn,
                config.parentFillColour,
                baddestColour,
                authorScale.copy().domain([0, 1, 2, config.maxAuthors])),
            strokeFn: zebraStrokeFnBuilder(config),
        },
        language: {
            fillFn: buildScaledNodeColourFn(languageDataFn,
                config.parentFillColour,
                config.neutralColour,
                language => languageColours.get(language).get('colour')),
            strokeFn: zebraStrokeFnBuilder(config),
        },
        loc: {
            fillFn: baseLocFillFn,
            strokeFn: zebraStrokeFnBuilder(config),
        },
        boicy: {
            fillFn: locFillFn,
            strokeFn: zebraStrokeFnBuilder(config),
        },
        worst_indent: {
            fillFn: buildScaledNodeColourFn(worstIndentDataFn,
                config.parentFillColour,
                config.neutralColour,
                goodBadScale.copy().domain([0, config.maxIndent])),
            strokeFn: zebraStrokeFnBuilder(config),
        },
        average_indent: {
            fillFn: buildScaledNodeColourFn(averageIndentDataFn,
                config.parentFillColour,
                config.neutralColour,
                goodBadScale.copy().domain([0, config.maxIndent])),
            strokeFn: zebraStrokeFnBuilder(config),
        },
    };
}

function initialiseChartElements(rootSelector, config) {
    const chartEl = d3.select(rootSelector).append('svg')
        .attr('width', config.displayWidth)
        .attr('height', config.displayHeight)
        .attr('viewBox', `0,0,${config.displayWidth * config.displayPixelRatio},${config.displayHeight * config.displayPixelRatio}`)
        .append('g');

    return {
        chartEl,
    };
}

function addPaths(node, parentPath) {
    if (parentPath === null) {
        node.path = '';
    } else {
        node.path = (parentPath === '' ? node.name : `${parentPath}/${node.name}`);
    }
    if (node.children !== undefined) {
        for (let child of node.children) {
            addPaths(child, node.path);
        }
    }

    return node; // temp for chaining
}

function buildHierarchy(data) {
    return d3.hierarchy(data, d => d.children)
        .sum((d) => {
            if (d.data === undefined || d.data.cloc === undefined) {
                return 1;
            }
            return d.data.cloc.code;
        })
        .sort((a, b) => b.height - a.height || b.value - a.value);
}

function verifyNodeLink(pathSoFar, name) {
    const [head, ...remaining] = pathSoFar;
    const url = `https://github.com/alphagov/${head}/blob/master/${remaining.join('/')}`;
    return `<a target="_blank" class="node_link" href="${url}">${name}</a>`;
}

function nodeLink(urlPrefix, path, name) {
    return `<a target="_blank" class="node_link" href="${urlPrefix}/${path}">${name}</a>`;
}

function nodeHtmlDetails(urlPrefix, node, isVerify) {
    const pathBits = node.data.path.split('/');
    const pathBitsHtml = pathBits.map((name, index) => {
        const pathSoFar = pathBits.slice(0, index + 1);
        const link = isVerify ? verifyNodeLink(pathSoFar, name)
            : nodeLink(urlPrefix, pathSoFar.join('/'), name);
        return `<button class="zoomer" data-path="${pathSoFar.join('/')}">-></button> ${link}`;
    })
        .join('<br/>');

    const age = ageMonthsDataFn(node);
    const ageHtml = age === undefined ? '' : `<p>${age} months since changed</p>`;

    const authors = authorsDataFn(node);
    const authorsHtml = authors === undefined ? '' : `<p>${authors} authors</p>`;

    const averageIndent = averageIndentDataFn(node);
    const averageIndentHtml = averageIndent === undefined ? '' : `<p>Average indent: ${averageIndent}`;

    const worstIndent = worstIndentDataFn(node);
    const worstIndentHtml = worstIndent === undefined ? '' : `<p>Worst indent: ${worstIndent}`;

    return `<p>${pathBitsHtml}</p><p>${node.value} lines of code.</p>${ageHtml}${authorsHtml}${averageIndentHtml}${worstIndentHtml}`;
}

function treeNodeByPath(tree, pathArray) {
    if (pathArray.length === 0) {
        return tree;
    }
    const [name, ...rest] = pathArray;
    const child = tree.children.find(n => n.name === name);
    if (child === undefined) {
        throw Error(`no child found called ${name}`);
    }
    return treeNodeByPath(child, rest);
}

function nodeIsNestingOnly(node) {
    // true for nodes that have one child - Java does this a lot with 'java/uk/gov/ida' package standards
    if (node.children === undefined || node.children === null) {
        return false;
    }

    return node.children.length === 1;
}

function paddingOuterFn(node) {
    if (node.depth === 0) {
        return 8;
    }
    if (node.depth === 1) {
        return 4;
    }
    if (node.depth === 2) {
        return 2;
    }
    if (nodeIsNestingOnly(node.parent)) {
        return 0;
    }
    return 1;
}

function paddingInnerFn(_node) {
    // TODO - consider inner padding if there are grandkids?
    // if (nodeIsNestingOnly(node)) {
    //     return 0;
    // }
    // if nodeHasGrandkids(node) {
    //   return 1;
    // }
    return 0;
}

function strokeWidthFn(node) {
    if (nodeIsNestingOnly(node)) {
        return 0;
    }
    if (node.depth === 0) {
        return 8;
    }
    if (node.depth === 1) {
        return 4;
    }
    if (node.depth === 2) {
        return 2;
    }
    return 1;
}

function updateChart(config, elements, state, selectNodeCallback, refreshFn) {
    const {
        chartEl,
    } = elements;

    // rebuild the hierarchy every time - we could in theory do this once,
    //  but I'm worried becauase treemap mutates the nodes, so it gets
    //  ugly fast.  I _think_ this builds a new datastructure safely
    //  each time.

    const rootNode = treeNodeByPath(state.selectedChart.rawData, state.rootNodePath);
    const rootHierarchy = buildHierarchy(rootNode);

    const treemap = d3.treemap()
        .size([config.displayWidth * config.displayPixelRatio, config.displayHeight * config.displayPixelRatio])
        .paddingOuter(paddingOuterFn).paddingInner(paddingInnerFn);

    treemap(rootHierarchy);

    const nodes = chartEl.datum(rootHierarchy)
        .selectAll('.node')
        .data(rootHierarchy.descendants(), node => node.path);

    const newNodes = nodes
        .enter()
        .append('rect')
        .attr('class', 'node');

    nodes.merge(newNodes)
        .attr('x', n => `${n.x0}px`)
        .attr('y', n => `${n.y0}px`)
        .attr('width', n => `${n.x1 - n.x0}px`)
        .attr('height', n => `${n.y1 - n.y0}px`)
        .style('fill', state.currentStrategy.fillFn)
        .style('stroke', state.currentStrategy.strokeFn)
        .style('stroke-width', strokeWidthFn)
        .on('click', selectNodeCallback)
        .on('mouseover', (d, i, nodes2) => d3.select(nodes2[i]).style('stroke', d3.rgb('yellow')))
        .on('mouseout', (d, i, nodes2) => d3.select(nodes2[i]).style('stroke', state.currentStrategy.strokeFn))
        .append('svg:title')
        .text(n => n.data.path);

    nodes
        .exit()
        .remove();
}

function unSelect(chartState, el, node) {
    if (el) {
        d3.select(el).style('fill', chartState.currentStrategy.fillFn(node));
    }
}
function select(chartState, el, node) {
    d3.select(el).style('fill', d3.color(chartState.currentStrategy.fillFn(node)).brighter());
}

function onZoomButtonClickedFn(chartState, el, refreshFn) {
    const path = el.getAttribute('data-path');
    const pathBits = path === '' ? [] : path.split('/');

    return () => {
        const inspector = document.getElementById('inspector');
        chartState.selectedNode = null;
        chartState.selectedNodeElement = null;
        chartState.rootNodePath = pathBits;
        inspector.innerHTML = '';
        refreshFn();
    };
}

function onNodeClickedFn(config, chartState, refreshFn) {
    return (node, i, nodes) => {
        if (chartState.selectedNodeElement !== undefined) {
            unSelect(chartState, chartState.selectedNodeElement, chartState.selectedNode);
        }
        chartState.selectedNodeElement = nodes[i];
        chartState.selectedNode = node;
        select(chartState, chartState.selectedNodeElement, chartState.selectedNode);

        const inspector = document.getElementById('inspector');
        inspector.innerHTML = nodeHtmlDetails(chartState.selectedChart.urlPrefix, node, chartState.selectedChartName === 'verify');

        inspector.querySelectorAll('button.zoomer')
            .forEach((el) => {
                el.addEventListener('click', onZoomButtonClickedFn(chartState, el, refreshFn));
            });
    };
}

const chartElements = initialiseChartElements('#chart_parent', chartConfig);

const languageCounts = countLanguagesIn(allData);
const languageColours = buildLanguageColours(languageCounts);

const strategies = buildColourStrategies(chartConfig, languageColours);

const projectEl = document.getElementById('project');

Object.entries(allData)
    .sort(([p1, _d1], [p2, _d2]) => p1.localeCompare(p2))
    .forEach(([project, data]) => {
        addPaths(data.rawData, null);
        const selectedText = (project === 'verify') ? ' selected' : '';
        projectEl.insertAdjacentHTML('beforeEnd',
            `<option value="${project}"${selectedText}>${data.chartTitle}</option>`);
    });

// ugly choices - currently this is global. Can we make it not global?
// all the DOM it references is global.
// maybe just name it "uglyGlobalChartState"
// make the 'refresh' command take a new global chart state?  Otherwise pretend it is immutable.
const globalChartState = {
    selectedChartName: 'verify',
    selectedChart: allData.verify,
    selectedNodeElement: null,
    selectedNode: null,
    rootNodePath: [],
    currentStrategyName: 'language',
    currentStrategy: strategies.language,
};

function refresh() {
    console.log("refreshing");
    const chartTitle = globalChartState.rootNodePath.length == 0
        ? globalChartState.selectedChart.chartTitle
        : `${globalChartState.selectedChart.chartTitle} ${globalChartState.rootNodePath.join('/')}`;
    document.getElementById('chart_title').innerHTML = chartTitle;
    if (globalChartState.rootNodePath.length == 0) {
        document.getElementById('home_zoom').style.display = 'none';
    } else {
        document.getElementById('home_zoom').style.display = 'block';
    }

    updateChart(chartConfig, chartElements, globalChartState, onNodeClickedFn(chartConfig, globalChartState, refresh), refresh);
}

function onStrategyChange(chartState, refreshFn) {
    chartState.currentStrategyName = document.getElementById('strategy').value;
    chartState.currentStrategy = strategies[chartState.currentStrategyName];
    console.log(`updated to strategy ${chartState.currentStrategyName}`);
    refreshFn();
}

function onProjectChange(chartState, refreshFn) {
    const inspector = document.getElementById('inspector');
    chartState.selectedNode = null;
    chartState.selectedNodeElement = null;
    chartState.rootNodePath = [];
    inspector.innerHTML = '';
    const project = document.getElementById('project').value;
    chartState.selectedChartName = project;
    chartState.selectedChart = allData[project];
    refreshFn();
}

document.getElementById('strategy').addEventListener('change', () => onStrategyChange(globalChartState, refresh));
const homeZoomButton = document.getElementById('home_zoom');
homeZoomButton.addEventListener('click', onZoomButtonClickedFn(globalChartState, homeZoomButton, refresh));
projectEl.addEventListener('change', () => onProjectChange(globalChartState, refresh));

refresh();

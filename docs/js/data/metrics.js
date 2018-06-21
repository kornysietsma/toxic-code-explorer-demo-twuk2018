// import { gocd_chartTitle, gocd_urlPrefix, gocd_rawData } from './gocd.js';
import { mongodb_chartTitle, mongodb_urlPrefix, mongodb_rawData } from './mongodb.js';
import { fishnet_chartTitle, fishnet_urlPrefix, fishnet_rawData } from './fishnet.js';
// import { incanter_chartTitle, incanter_urlPrefix, incanter_rawData } from './incanter.js';
import { clojure_chartTitle, clojure_urlPrefix, clojure_rawData } from './clojure.js';
import { kubernetes_chartTitle, kubernetes_urlPrefix, kubernetes_rawData } from './kubernetes.js';
import { linux_chartTitle, linux_urlPrefix, linux_rawData } from './linux.js';
// import { openmrs_chartTitle, openmrs_urlPrefix, openmrs_rawData } from './openmrs.js';
import { squidnet_chartTitle, squidnet_urlPrefix, squidnet_rawData } from './squidnet.js';
import { squidnet_webapi_chartTitle, squidnet_webapi_urlPrefix, squidnet_webapi_rawData } from './squidnet_webapi.js';
import { spring_chartTitle, spring_urlPrefix, spring_rawData } from './spring.js';
import { verify_chartTitle, verify_urlPrefix, verify_rawData } from './verify.js';
import { vscode_chartTitle, vscode_urlPrefix, vscode_rawData } from './vscode.js';
import { gmat_chartTitle, gmat_urlPrefix, gmat_rawData } from './gmat.js';

export const allData = {
    // gocd: {chartTitle: gocd_chartTitle, urlPrefix: gocd_urlPrefix, rawData: gocd_rawData},
    mongodb: {chartTitle: mongodb_chartTitle, urlPrefix: mongodb_urlPrefix, rawData: mongodb_rawData},
    fishnet: {chartTitle: fishnet_chartTitle, urlPrefix: fishnet_urlPrefix, rawData: fishnet_rawData},
    // incanter: {chartTitle: incanter_chartTitle, urlPrefix: incanter_urlPrefix, rawData: incanter_rawData},
    clojure: {chartTitle: clojure_chartTitle, urlPrefix: clojure_urlPrefix, rawData: clojure_rawData},
    kubernetes: {chartTitle: kubernetes_chartTitle, urlPrefix: kubernetes_urlPrefix, rawData: kubernetes_rawData},
    linux: {chartTitle: linux_chartTitle, urlPrefix: linux_urlPrefix, rawData: linux_rawData},
    // openmrs: {chartTitle: openmrs_chartTitle, urlPrefix: openmrs_urlPrefix, rawData: openmrs_rawData},
    squidnet: {chartTitle: squidnet_chartTitle, urlPrefix: squidnet_urlPrefix, rawData: squidnet_rawData},
    squidnet_webapi: {chartTitle: squidnet_webapi_chartTitle, urlPrefix: squidnet_webapi_urlPrefix, rawData: squidnet_webapi_rawData},
    spring: {chartTitle: spring_chartTitle, urlPrefix: spring_urlPrefix, rawData: spring_rawData},
    verify: {chartTitle: verify_chartTitle, urlPrefix: verify_urlPrefix, rawData: verify_rawData},
    vscode: {chartTitle: vscode_chartTitle, urlPrefix: vscode_urlPrefix, rawData: vscode_rawData},
    gmat: {chartTitle: gmat_chartTitle, urlPrefix: gmat_urlPrefix, rawData: gmat_rawData},
}

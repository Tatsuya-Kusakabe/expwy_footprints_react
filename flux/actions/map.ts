import _ from 'lodash';
import { default as axios } from 'axios';
import { Dispatcher } from '../dispatcher';
import { ActionTypes, Host, env } from '../../src/utilities/constants';
import { RawRoute, RawRouteNode, RawNode, FormattedNode } from '../../src/utilities/types';

interface FetchAllRoutesAction {
  type: typeof ActionTypes.MAP__FETCH_ALL_ROUTES;
  data: RawRoute[];
}

interface FetchAllNodesAction {
  type: typeof ActionTypes.MAP__FETCH_ALL_NODES;
  data: FormattedNode[][];
}

interface RouteChunk {
  routeId: string;
  chunkSequence: number;
}

export type MapAction =
  FetchAllRoutesAction
  | FetchAllNodesAction;

// routeChunk の中に node が存在すれば node を足して、存在しなければそのまま、accNode を返す関数
const pushNodes = (accNode: FormattedNode[], node: RawNode, routeChunk: RouteChunk) => {

  // 該当 node の中に、routeChunk に該当する RouteNode があるか
  const matchedRouteNode = node.RouteNodes.find((node: RawRouteNode) => {
    return node.routeId === routeChunk.routeId && node.chunkSequence === routeChunk.chunkSequence;
  });

  // 無い場合、accNode に何も足さずに返す
  if (!matchedRouteNode) return accNode;

  // ある場合、accNode にプロパティを足して返す
  return accNode.concat({
    id: node.id,
    name: node.name,
    latitude: node.latitude,
    longitude: node.longitude,
    routeId: matchedRouteNode.routeId,
    chunkSequence: matchedRouteNode.chunkSequence,
    jointSequence: matchedRouteNode.jointSequence,
    nodeSequence: matchedRouteNode.nodeSequence,
  });
};

export default {
  fetchAllRoutes(): void {
    axios
      .get(`${Host.node[env]}/api/routes`)
      .then((res: any) => {
        Dispatcher.handleServerAction({
          type: ActionTypes.MAP__FETCH_ALL_ROUTES,
          data: res.data,
        });
      })
      .catch((err: any) => console.log(err));
  },

  fetchAllNodes(): void {
    axios
      .get(`${Host.node[env]}/api/nodes`)
      .then((res: any) => {
        const rawNodes: RawNode[] = res.data;

        // routeChunk の組合せを列挙
        const routeChunkO: RouteChunk[] = rawNodes.reduce((accRouteChunkO: RouteChunk[], node) => {
          const routeChunkI = node.RouteNodes.reduce((accRouteChunkI: RouteChunk[], node) => {
            return accRouteChunkI.concat({
              routeId: node.routeId, chunkSequence: node.chunkSequence,
            });
          }, []); // tslint:disable-line: align
          return accRouteChunkO.concat(routeChunkI);
        }, []); // tslint:disable-line: align

        // 一意な routeChunk の組合せを抽出（参照ではなくプロパティが同じもの）
        const routeChunkSet = _.uniqWith(routeChunkO, _.isEqual);

        // 一意な routeChunk に含まれる node を列挙し、nodeSequence で昇順に並べ替え
        const formattedNodes: FormattedNode[][] = routeChunkSet.map((elem) => {
          return rawNodes
            .reduce((accNode: FormattedNode[], node) => pushNodes(accNode, node, elem), [])
            .sort((a: FormattedNode, b: FormattedNode) => a.nodeSequence - b.nodeSequence);
        });

        Dispatcher.handleServerAction({
          type: ActionTypes.MAP__FETCH_ALL_NODES,
          data: formattedNodes,
        });
      })
      .catch((err: any) => console.log(err));
  },
};
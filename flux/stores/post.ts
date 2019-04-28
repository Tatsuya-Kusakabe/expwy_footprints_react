import { Dispatcher } from '../dispatcher';
import { BaseStore } from '../base_store';
import { ActionTypes } from '../../src/utilities/constants';
import { Action, PostWithUser } from '../../src/utilities/types';

class BasePostStore extends BaseStore {
  getPosts(): PostWithUser[] {
    if (!this.get('posts')) this.set('posts', []);
    return this.get('posts');
  }

  setPosts(posts: PostWithUser[]): void {
    this.set('posts', posts);
  }
}

const PostStore = new BasePostStore();

PostStore.dispatchToken = Dispatcher.register((payload: any) => {
  const action: Action = payload.action;

  switch (action.type) {
    case ActionTypes.POST__FETCH_POSTS:
      PostStore.setPosts(action.data);
      PostStore.emitChange();
      break;

    default:
  }

  return true;
});

export default PostStore;
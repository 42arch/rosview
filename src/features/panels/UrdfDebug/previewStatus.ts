export type UrdfPreviewIssue = {
  url: string;
  reason: string;
};

export type UrdfPreviewBuildResult = {
  status: 'ready' | 'empty' | 'error';
  frameObjectCount: number;
  visibleFrameCount: number;
  meshTotal: number;
  meshFailed: number;
  issues: UrdfPreviewIssue[];
  errorMessage?: string;
};

export function countVisibleFrameObjects(model: {
  frameObjects: Array<{ object: { visible: boolean } }>;
}): number {
  return model.frameObjects.filter((entry) => entry.object.visible).length;
}

import React from 'react';
import ModuleSkeleton from '../../../common/components/ModuleSkeleton';
type Props = { height?: number; backgroundColor?: string };
function HomeSectionSkeleton({ height = 350 }: Props) {
  return <ModuleSkeleton height={height} />;
}
export default React.memo(HomeSectionSkeleton);

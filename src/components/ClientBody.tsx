'use client';

import React from 'react';
import IntroVideo from '@/components/IntroVideo';

export default function ClientBody({ children }: { children: React.ReactNode }) {
  return <IntroVideo>{children}</IntroVideo>;
}

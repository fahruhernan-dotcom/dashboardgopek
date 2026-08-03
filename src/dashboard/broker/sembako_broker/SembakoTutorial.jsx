import React from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import TutorialOverlay from '@/dashboard/_shared/components/TutorialOverlay'
import { SEMBAKO_STEPS } from './sembakoTutorialSteps'

const ACCENT = '#EA580C'
const ACCENT_DIM = 'rgba(234,88,12,0.12)'

export default function SembakoTutorial() {
  const { tenant } = useAuth()
  return (
    <TutorialOverlay
      steps={SEMBAKO_STEPS}
      storageKey={`sembako_tutorial_${tenant?.id}`}
      accent={ACCENT}
      accentDim={ACCENT_DIM}
    />
  )
}

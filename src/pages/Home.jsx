import { HeroSection, IntroSection, JourneyHighlightsSection, SelectedWorkSection } from '../components/home/HomeSections';
import { Page } from '../components/ui/Page';

/** Hero, the journey (organisations & achievements), then personal projects. The footer carries the contact invitation. */
export function Home() {
  return (
    <Page shell={false}>
      <HeroSection />
      <IntroSection />
      <JourneyHighlightsSection />
      <SelectedWorkSection />
    </Page>
  );
}

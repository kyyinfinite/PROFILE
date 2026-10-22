import { HeroSection, IntroSection, SelectedWorkSection } from '../components/home/HomeSections';
import { Page } from '../components/ui/Page';

/** Restrained hero, then the work. The footer carries the contact invitation. */
export function Home() {
  return (
    <Page shell={false}>
      <HeroSection />
      <IntroSection />
      <SelectedWorkSection />
    </Page>
  );
}

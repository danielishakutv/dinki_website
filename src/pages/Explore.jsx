import React from 'react';
import FeedShell from '../components/styles/FeedShell';
import StyleFeed from '../components/styles/StyleFeed';

export default function Explore() {
  return (
    <FeedShell>
      <StyleFeed
        heading="Explore Styles"
        subheading="Discover looks from tailors across Africa and beyond — save your favourites, then order the exact style, made for you."
        defaultSort="trending"
      />
    </FeedShell>
  );
}

import React from 'react';

// import Carousel from '@brainhubeu/react-carousel';
// import '@brainhubeu/react-carousel/lib/style.css';

import Carousel, { Dots } from '@brainhubeu/react-carousel';
import '@brainhubeu/react-carousel/lib/style.css';

class TuringCarousel extends React.Component {
  constructor() {
    super()
    this.state = {
      value: 0,
      slides: [
        (<h1>Peanut</h1>),
        (<h1>Butter</h1>),
        (<h1>Yummy</h1>),
      ],
      thumbnails: [
        (<h1>Peanut</h1>),
        (<h1>Butter</h1>),
        (<h1>Yummy</h1>),
      ],
    }
    this.onchange = this.onchange.bind(this);
  }


  onchange(value) {
    this.setState({ value });
  }

  render() {
    return (
    <div>
      <Carousel
        value={this.state.value}
        slides={this.state.slides}
        onChange={this.onchange}
      />
      <Dots number={this.state.thumbnails.length} thumbnails={this.state.thumbnails} value={this.state.value} onChange={this.onchange} number={this.state.slides.length} />
    </div>
    );
  }
}

export default TuringCarousel
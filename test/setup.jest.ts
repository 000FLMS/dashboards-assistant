/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// import '@testing-library/jest-dom/extend-expect';
import { configure } from '@testing-library/react';
import { TextDecoder, TextEncoder } from 'util';
import 'web-streams-polyfill';
import './fetch-polyfill';

configure({ testIdAttribute: 'data-test-subj' });

window.URL.createObjectURL = () => '';
HTMLCanvasElement.prototype.getContext = () => '' as any;
window.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  disconnect() {
    return null;
  }

  observe() {
    return null;
  }

  takeRecords() {
    return null;
  }

  unobserve() {
    return null;
  }
} as any;

jest.mock('@elastic/eui/lib/components/form/form_row/make_id', () => () => 'random-id');

jest.mock('@elastic/eui/lib/services/accessibility/html_id_generator', () => ({
  htmlIdGenerator: () => {
    return () => 'random_html_id';
  },
}));

jest.setTimeout(30000);

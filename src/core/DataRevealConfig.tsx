// src/core/dataRevealConfig.ts
//
// THE ONLY PLACE ANY VALUES LIVE for the DataRevealScene.
// Every rig is a template. This config dictates everything.
//
// To change the animation: edit this file only.
// To create a new variation: duplicate this file with a new name.

import { DataRevealConfig } from '../MyComp/DataRevealScene';

export const dataRevealConfig: DataRevealConfig = {

  // ── Layout ──────────────────────────────────────────────────────────────────
  splitFraction:   0.32,
  dividerColor:    '#e0e0e0',
  dividerPadding:  60,
  background:      '#ffffff',

  // ── Input box style ─────────────────────────────────────────────────────────
  inputBoxStyle: {
    backgroundColor: '#f5f5f5',
    textColor:       '#1a1a1a',
    fontSize:        28,
    fontFamily:      'Poppins, sans-serif',
  },

  // ── Gap between charts ───────────────────────────────────────────────────────
  gapBetweenCharts: 20,

  // ── Stats — one per chart ────────────────────────────────────────────────────
  // The text typed in the left box is causally linked to the chart on the right.
  // Typing finishes → chart animates in.
  stats: [

    // ── Stat 1: Regional revenue breakdown ────────────────────────────────────
    {
      text:        'Q3 Revenue by Region ($M)',
      typingSpeed: 22,
      chart: {
        type:             'bar',
        durationInFrames: 150,
        data: {
          labels: ['N. America', 'Europe', 'Asia', 'Africa'],
          values: [42, 31, 28, 11],
        },
        barColors: ['#B5E3FF', '#B5EAD7', '#FFDAC1', '#FFB3BA'],
      },
    },

    // ── Stat 2: Market share ─────────────────────────────────────────────────
    {
      text:        'Market Share by Segment (%)',
      typingSpeed: 20,
      chart: {
        type:             'donut',
        durationInFrames: 140,
        data: {
          labels: ['Enterprise', 'SME', 'Consumer', 'Gov', 'Other'],
          values: [38, 27, 2, 13, 10],
        },
        pieColors: ['#B5E3FF', '#B5EAD7', '#FFDAC1', '#FFB3BA'],
      },
    },

    // ── Stat 3: Growth trend ─────────────────────────────────────────────────
    {
      text:        'YoY Growth — Revenue vs Profit',
      typingSpeed: 18,
      chart: {
        type:             'area',
        durationInFrames: 160,
        curveType:        'curved',
        data: {
          labels:  ['Q1', 'Q2', 'Q3', 'Q4'],
          series: [
            { name: 'Revenue', values: [28, 35, 42, 51], color: '#B5E3FF' },
            { name: 'Profit',  values: [8,  12, 18, 24], color: '#B5EAD7' },
          ],
        },
      },
    },

  ],
};
/* eslint-disable import/first */
/* eslint-disable import/order */
import dotenv from 'dotenv'
dotenv.config()

import React from 'react'
import { render } from 'react-dom'

import Router from './routes'

render(<Router />, document.getElementById('app'))

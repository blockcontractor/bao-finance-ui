import { useCallback, useEffect, useState } from 'react'
import { provider } from 'web3-core'

import BigNumber from 'bignumber.js'
import { useWallet } from 'use-wallet'
import { Contract } from 'web3-eth-contract'

import {
  getMasterChefContract,
  getWethContract,
  getFarms,
  getTotalLPWethValue,
} from '../bao/utils'
import useBao from './useBao'
import useBlock from './useBlock'
import { ChainId } from '@uniswap/sdk'

export interface StakedValue {
  tokenAmount: BigNumber
  wethAmount: BigNumber
  totalWethValue: BigNumber
  tokenPriceInWeth: BigNumber
  poolWeight: BigNumber
}

const useAllStakedValue = () => {
  const [balances, setBalance] = useState([] as Array<StakedValue>)
  const { account }: { account: string; ethereum: provider } = useWallet()
  const bao = useBao()
  const farms = getFarms(bao)
  const masterChefContract = getMasterChefContract(bao)
  const wethContract = getWethContract(bao)
  const block = useBlock()

  const fetchAllStakedValue = useCallback(async () => {
    console.log('%cFetch all staked value', 'background-color: hotpink;')
    console.log(`Mainnet: ${ChainId.MAINNET}`)
    // @ts-ignore TODO:
    const batchRequest = new bao.web3.BatchRequest()

    const balancePromises = farms.map(
      ({
        pid,
        lpContract,
        tokenContract,
        denominatorContract,
        tokenDecimals,
        mainnetDenominatorAddress,
      }: {
        pid: number
        mainnetDenominatorAddress: string | null
        lpContract: Contract
        tokenContract: Contract
        denominatorContract: Contract
        tokenDecimals: number
      }) =>
        getTotalLPWethValue(
          masterChefContract,
          lpContract,
          tokenContract,
          denominatorContract,
          mainnetDenominatorAddress,
          tokenDecimals,
          pid,
          batchRequest,
        ),
    )

    batchRequest.execute()

    const balances: Array<StakedValue> = await Promise.all(balancePromises)

    setBalance(balances)
  }, [account, masterChefContract, bao])

  useEffect(() => {
    if (account && masterChefContract && bao) {
      fetchAllStakedValue()
    }
  }, [account, masterChefContract, setBalance, bao])

  return balances
}

export default useAllStakedValue

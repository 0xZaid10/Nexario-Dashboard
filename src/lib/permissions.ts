import { createWalletClient, custom, parseUnits } from 'viem'
import { base, sepolia } from 'viem/chains'
import { getFlaskProvider } from './providers'

export interface PermissionResult {
  permissionsContext: string
  isDemo: boolean
  isFlask: boolean
  method: string
  address?: string
}

const USDC: Record<number, `0x${string}`> = {
  1:        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  8453:     '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
}

export async function requestExecutionPermissions(params: {
  budgetUsdc: number
  durationHours: number
  chainId?: number
}): Promise<PermissionResult> {
  const { budgetUsdc, durationHours, chainId = 8453 } = params  // Base mainnet — user's USDC

  const flaskProvider = await getFlaskProvider()
  if (!flaskProvider) {
    console.warn('Flask not found — using demo')
    return { permissionsContext: '0x' + '01'.repeat(32), isDemo: true, isFlask: false, method: 'demo' }
  }

  // Get Flask account
  const accounts = await flaskProvider.request({
    method: 'eth_requestAccounts',
  }) as `0x${string}`[]
  const sessionAddress = accounts[0]
  if (!sessionAddress) throw new Error('No Flask account. Unlock MetaMask Flask.')
  console.log('Flask address:', sessionAddress)

  try {
    const { erc7715ProviderActions } = await import('@metamask/smart-accounts-kit/actions')

    // MUST use Flask provider in custom() — not window.ethereum
    const walletClient = createWalletClient({
      chain: chainId === 8453 ? base : sepolia,
      transport: custom(flaskProvider),
    }).extend(erc7715ProviderActions())

    const usdcAddress = USDC[chainId] ?? USDC[8453]!
    const expiry = Math.floor(Date.now() / 1000) + durationHours * 3600

    // Correct format — viem wrapper transforms:
    // expiry → rules: [{ type: 'expiry', data: { timestamp } }]
    // permission (singular) → permission in RPC output
    // chainId (number) → toHex in RPC output
    // to → to in RPC output
    const TARGET_ADDRESS = '0x26a529124f0bbf9af9d8f9f84a43efe47cf1199a'  // 1Shot Base targetAddress

    const grantedPermissions = await walletClient.requestExecutionPermissions([{
      chainId,
      expiry,
      to: TARGET_ADDRESS as `0x${string}`,  // delegate TO 1Shot relayer
      permission: {
        type: 'erc20-token-periodic' as const,
        isAdjustmentAllowed: true,
        data: {
          tokenAddress: usdcAddress,
          periodAmount: parseUnits(budgetUsdc.toString(), 6),
          periodDuration: durationHours * 3600,
          startTime: Math.floor(Date.now() / 1000),
          justification: `Nexario agent network — $${budgetUsdc} USDC for ${durationHours}h`,
        },
      },
    }])

    // Log full structure safely - NO truncation
    const safeResult = JSON.stringify(grantedPermissions, (_k, v) =>
      typeof v === 'bigint' ? v.toString() : v, 2)
    console.log('ERC-7715 FULL RESPONSE:', safeResult)

    // Flask returns ERC-7715 permission objects with a `context` field
    // The `context` field IS the ABI-encoded delegation chain for 1Shot
    const grantedArr = Array.isArray(grantedPermissions) ? grantedPermissions : [grantedPermissions]
    const firstGrant = grantedArr[0] as any

    // Path 1: use the `context` field directly — this is the real permissionsContext
    let ctx: string | undefined
    ctx = firstGrant?.context ?? firstGrant?.permissionsContext

    // Path 2: check top-level permissionsContext
    if (!ctx) {
      ctx = (grantedPermissions as any)?.permissionsContext
    }

    // Path 3: store full JSON as fallback (backend can extract context)
    if (!ctx) {
      ctx = JSON.stringify(grantedArr, (_key, val) =>
        typeof val === 'bigint' ? `0x${val.toString(16)}` : val
      )
    }

    console.log('permissionsContext from context field:', ctx?.startsWith('0x'), 'length:', ctx?.length)

    return {
      permissionsContext: ctx!,
      isDemo: false,
      isFlask: true,
      method: 'requestExecutionPermissions',
      address: sessionAddress,
    }
  } catch (err: any) {
    console.error('ERC-7715 failed:', err.message, err)
    return {
      permissionsContext: '0x' + '01'.repeat(32),
      isDemo: true,
      isFlask: true,
      method: 'demo',
      address: sessionAddress,
    }
  }
}

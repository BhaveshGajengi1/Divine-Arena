import { DemoModeProvider } from "@/lib/demo/demo-context"
import { WalletProvider } from "@/lib/wallet/wallet-context"
import { GuidedFlow } from "@/components/demo/guided-flow"

export default function Home() {
  return (
    <WalletProvider>
      <DemoModeProvider>
        <GuidedFlow />
      </DemoModeProvider>
    </WalletProvider>
  )
}

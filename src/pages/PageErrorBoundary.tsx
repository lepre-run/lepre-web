import { Component, type ErrorInfo, type JSX, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui";

type PageErrorBoundaryProps = Readonly<{ children: ReactNode; resetKey?: string }>;
type PageErrorBoundaryState = Readonly<{ failed: boolean }>;

function PageErrorFallback(): JSX.Element {
  const { t } = useTranslation();

  return (
    <main className="shell shell--centered">
      <p className="wordmark">lepre</p>
      <div className="page-error__message" role="alert">
        <h1>{t("pageError.title")}</h1>
        <p>{t("pageError.description")}</p>
      </div>
      <p>
        <Button onClick={() => window.location.reload()}>{t("pageError.reload")}</Button>
      </p>
    </main>
  );
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): PageErrorBoundaryState {
    return { failed: true };
  }

  componentDidUpdate(previous: PageErrorBoundaryProps): void {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("The page failed to render.", error, info.componentStack);
  }

  render(): ReactNode {
    return this.state.failed ? <PageErrorFallback /> : this.props.children;
  }
}

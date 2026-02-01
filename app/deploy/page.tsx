import { redirect } from 'next/navigation';

/**
 * Deploy page - redirects to GPU marketplace
 *
 * This page previously used the legacy k8s-proxy-server system.
 * Now redirects to /rent which uses the Hub API + Contract system.
 */
export default function DeployPage() {
    redirect('/rent');
}

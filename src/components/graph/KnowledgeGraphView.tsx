import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Search,
  Filter,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  ExternalLink,
  BookOpen,
  Tag,
  Shield,
  ArrowRight,
  Info,
  Check,
  CheckCircle2,
  FileText,
  Sparkles,
  ArrowUpRight,
  Sliders,
  Award,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { GraphData, GraphNode, GraphLink, Standard, RecommendationResponse } from '../../types';
import { TenderSummaryModal } from '../tender/TenderSummaryModal';

interface KnowledgeGraphViewProps {
  onSelectStandardForTender?: (standardId: string) => void;
  activeRecommendation?: RecommendationResponse | null;
  onActiveRecommendationChange?: (rec: RecommendationResponse | null) => void;
  onNavigateToTender?: () => void;
  initialMode?: 'catalog' | 'tender';
}

const CATEGORY_COLORS: Record<string, { bg: string; stroke: string; text: string }> = {
  Lighting: { bg: '#fef3c7', stroke: '#d97706', text: '#92400e' },
  'Industrial Safety': { bg: '#fee2e2', stroke: '#dc2626', text: '#991b1b' },
  Electrical: { bg: '#dbeafe', stroke: '#2563eb', text: '#1e40af' },
  'Water & Plumbing': { bg: '#cffafe', stroke: '#0891b2', text: '#155e75' },
  'Construction & Materials': { bg: '#f5f5f4', stroke: '#78716c', text: '#44403c' },
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  NORMATIVE_REFERENCE: '#2563eb',
  TEST_METHOD: '#059669',
  SAFETY_STANDARD: '#dc2626',
  MATERIAL_STANDARD: '#d97706',
  INSTALLATION_STANDARD: '#7c3aed',
  RELATED_TO: '#64748b',
  PRIMARY_RECOMMENDATION: '#4f46e5',
};

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  onSelectStandardForTender,
  activeRecommendation,
  onActiveRecommendationChange,
  onNavigateToTender,
  initialMode = 'catalog',
}) => {
  const [activeTabMode, setActiveTabMode] = useState<'catalog' | 'tender'>(
    initialMode === 'tender' && activeRecommendation ? 'tender' : initialMode
  );

  // Full Catalog Graph State
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRelType, setSelectedRelType] = useState<string>('All');
  const [selectedNode, setSelectedNode] = useState<Standard | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Tender-specific Graph State
  const [currentRec, setCurrentRec] = useState<RecommendationResponse | null>(activeRecommendation || null);
  const [tenderFilterStatus, setTenderFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [selectedTenderNodeId, setSelectedTenderNodeId] = useState<string | null>(null);
  const [tenderLoading, setTenderLoading] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // Sync external active recommendation
  useEffect(() => {
    if (activeRecommendation) {
      setCurrentRec(activeRecommendation);
      if (initialMode === 'tender') {
        setActiveTabMode('tender');
      }
    }
  }, [activeRecommendation, initialMode]);

  // Load Catalog Graph Data
  useEffect(() => {
    async function fetchGraph() {
      try {
        const res = await fetch('/api/graph');
        if (res.ok) {
          const data: GraphData = await res.json();
          setGraphData(data);
        }
      } catch (err) {
        console.error('Failed to load catalog graph data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchGraph();
  }, []);

  // Fetch latest tender recommendation from server if not set
  useEffect(() => {
    if (!currentRec) {
      fetch('/api/recommendations/latest')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.recommendation) {
            setCurrentRec(data.recommendation);
          }
        })
        .catch(() => { });
    }
  }, [currentRec]);

  // Quick Load Sample Tender for Immediate Graph Exploration
  const handleLoadSampleTender = async (sampleType: 'lighting' | 'cement') => {
    setTenderLoading(true);
    try {
      const specText =
        sampleType === 'lighting'
          ? 'Supply and installation of 45W outdoor LED street lighting luminaires for municipal highway road illumination with surge protection 10kV, IP66 waterproof enclosure, IK08 impact resistance, and BIS standard compliance.'
          : 'Procurement of 53 Grade Ordinary Portland Cement (OPC) for high-strength reinforced concrete bridge construction with compressive strength 53 MPa at 28 days and statutory ISI mark.';

      const res = await fetch('/api/recommendations/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specificationText: specText }),
      });

      if (res.ok) {
        const data: RecommendationResponse = await res.json();
        setCurrentRec(data);
        if (onActiveRecommendationChange) {
          onActiveRecommendationChange(data);
        }
        setActiveTabMode('tender');
      }
    } catch (err) {
      console.error('Failed to load sample tender recommendation:', err);
    } finally {
      setTenderLoading(false);
    }
  };

  // Fetch standard details for catalog graph node click
  const handleNodeClick = async (nodeId: string) => {
    try {
      const res = await fetch(`/api/standards/${nodeId}`);
      if (res.ok) {
        const std: Standard = await res.json();
        setSelectedNode(std);
      }
    } catch (err) {
      console.error('Failed to fetch standard details:', err);
    }
  };

  // Human-in-the-Loop review actions in Tender Graph
  const handleReviewActionInGraph = async (standardId: string, action: 'approve' | 'reject' | 'reset') => {
    if (!currentRec) return;

    const stdLower = standardId.toLowerCase().trim();
    const currPrimary = currentRec.primaryRecommendations.find(
      (p) => p.standardId.toLowerCase().trim() === stdLower
    );
    const currRelated = currentRec.relatedStandards.find(
      (r) => r.standardId.toLowerCase().trim() === stdLower
    );
    const currentStatus = (currPrimary || currRelated)?.reviewStatus;

    let targetStatus: 'approved' | 'rejected' | 'pending' =
      action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending';

    if (action === 'approve' && currentStatus === 'approved') {
      targetStatus = 'pending';
    } else if (action === 'reject' && currentStatus === 'rejected') {
      targetStatus = 'pending';
    }

    const updatedPrimary = currentRec.primaryRecommendations.map((p) =>
      p.standardId.toLowerCase().trim() === stdLower ? { ...p, reviewStatus: targetStatus } : p
    );
    const updatedRelated = currentRec.relatedStandards.map((r) =>
      r.standardId.toLowerCase().trim() === stdLower ? { ...r, reviewStatus: targetStatus } : r
    );

    const updatedRec: RecommendationResponse = {
      ...currentRec,
      primaryRecommendations: updatedPrimary,
      relatedStandards: updatedRelated,
    };

    setCurrentRec(updatedRec);
    if (onActiveRecommendationChange) {
      onActiveRecommendationChange(updatedRec);
    }

    try {
      const apiAction =
        targetStatus === 'pending' ? 'reset' : targetStatus === 'approved' ? 'approve' : 'reject';
      const endpoint = `/api/recommendations/${currentRec.recommendationId}/${apiAction}`;

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standardId }),
      });
    } catch (err) {
      console.error('Failed to sync review action in graph:', err);
    }
  };

  // Node coordinate generator for Catalog Graph (clustered layout)
  const nodePositions = useMemo(() => {
    const posMap = new Map<string, { x: number; y: number }>();
    const categoryClusters: Record<string, { cx: number; cy: number; radius: number }> = {
      Lighting: { cx: 200, cy: 180, radius: 110 },
      'Industrial Safety': { cx: 620, cy: 160, radius: 110 },
      Electrical: { cx: 420, cy: 380, radius: 120 },
      'Water & Plumbing': { cx: 180, cy: 520, radius: 110 },
      'Construction & Materials': { cx: 650, cy: 500, radius: 120 },
    };

    const catBuckets = new Map<string, GraphNode[]>();
    for (const node of graphData.nodes) {
      if (!catBuckets.has(node.category)) catBuckets.set(node.category, []);
      catBuckets.get(node.category)!.push(node);
    }

    for (const [cat, nodes] of catBuckets.entries()) {
      const cluster = categoryClusters[cat] || { cx: 400, cy: 300, radius: 120 };
      nodes.forEach((n, idx) => {
        const angle = (idx / nodes.length) * 2 * Math.PI;
        const x = cluster.cx + Math.cos(angle) * cluster.radius;
        const y = cluster.cy + Math.sin(angle) * cluster.radius;
        posMap.set(n.id, { x, y });
      });
    }

    return posMap;
  }, [graphData.nodes]);

  // Catalog filtered nodes and links
  const filteredCatalogNodes = useMemo(() => {
    return graphData.nodes.filter((n) => {
      const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [graphData.nodes, selectedCategory, searchQuery]);

  const filteredCatalogNodeIds = useMemo(
    () => new Set(filteredCatalogNodes.map((n) => n.id)),
    [filteredCatalogNodes]
  );

  const filteredCatalogLinks = useMemo(() => {
    return graphData.links.filter((link) => {
      const matchesRelType = selectedRelType === 'All' || link.type === selectedRelType;
      const nodesVisible = filteredCatalogNodeIds.has(link.source) && filteredCatalogNodeIds.has(link.target);
      return matchesRelType && nodesVisible;
    });
  }, [graphData.links, selectedRelType, filteredCatalogNodeIds]);

  // -------------------------------------------------------------
  // TENDER RECOMMENDATION GRAPH TOPOLOGY GENERATOR
  // -------------------------------------------------------------
  const tenderGraphTopology = useMemo(() => {
    if (!currentRec) return { nodes: [], links: [], nodePositions: new Map() };

    interface TenderGraphNode {
      id: string;
      label: string;
      title: string;
      category: string;
      kind: 'tender-root' | 'primary' | 'related';
      score?: number;
      reviewStatus?: 'approved' | 'rejected' | 'pending';
      whyRecommended?: string;
      reason?: string;
      relationshipType?: string;
      parentStandardNumber?: string;
      year?: string;
      status?: string;
      scope?: string;
      mandatoryParameters?: string[];
    }

    interface TenderGraphLink {
      source: string;
      target: string;
      type: string;
      label: string;
      description?: string;
    }

    const nodes: TenderGraphNode[] = [];
    const links: TenderGraphLink[] = [];
    const posMap = new Map<string, { x: number; y: number }>();

    // Root Tender Node
    const rootId = 'tender-spec-root';
    nodes.push({
      id: rootId,
      label: 'TENDER REQUIREMENT',
      title: currentRec.extractedRequirements.productName || 'Procurement Tender',
      category: currentRec.extractedRequirements.category || 'General',
      kind: 'tender-root',
    });
    posMap.set(rootId, { x: 425, y: 80 });

    // Primary Standards Nodes
    const primaryList = currentRec.primaryRecommendations;
    const primarySpacing = Math.min(240, 700 / (primaryList.length || 1));
    const primaryStartX = 425 - ((primaryList.length - 1) * primarySpacing) / 2;

    primaryList.forEach((p, idx) => {
      nodes.push({
        id: p.standardId,
        label: p.standardNumber,
        title: p.title,
        category: p.category,
        kind: 'primary',
        score: p.relevanceScore,
        reviewStatus: p.reviewStatus,
        whyRecommended: p.whyRecommended,
        year: p.year,
        status: p.status,
        scope: p.scope,
        mandatoryParameters: p.mandatoryParameters,
      });

      const px = primaryStartX + idx * primarySpacing;
      const py = 250;
      posMap.set(p.standardId, { x: px, y: py });

      links.push({
        source: rootId,
        target: p.standardId,
        type: 'PRIMARY_RECOMMENDATION',
        label: `${p.relevanceScore}% Match`,
        description: p.whyRecommended,
      });
    });

    // Related / Allied Standards Nodes
    const relatedList = currentRec.relatedStandards;
    const relatedSpacing = Math.min(180, 720 / (relatedList.length || 1));
    const relatedStartX = 425 - ((relatedList.length - 1) * relatedSpacing) / 2;

    relatedList.forEach((r, idx) => {
      nodes.push({
        id: r.standardId,
        label: r.standardNumber,
        title: r.title,
        category: currentRec.extractedRequirements.category,
        kind: 'related',
        relationshipType: r.relationshipType,
        reviewStatus: r.reviewStatus,
        reason: r.reason,
        parentStandardNumber: r.parentStandardNumber,
      });

      const rx = relatedStartX + idx * relatedSpacing;
      const ry = 460 + (idx % 2 === 0 ? 0 : 35); // slight vertical stagger for readability
      posMap.set(r.standardId, { x: rx, y: ry });

      // Find parent primary standard ID
      const parentPrimary = primaryList.find(
        (p) =>
          p.standardNumber.toLowerCase() === r.parentStandardNumber.toLowerCase() ||
          r.parentStandardNumber.toLowerCase().includes(p.standardNumber.toLowerCase())
      );
      const parentId = parentPrimary ? parentPrimary.standardId : primaryList[0]?.standardId || rootId;

      links.push({
        source: parentId,
        target: r.standardId,
        type: r.relationshipType,
        label: r.relationshipType.replace('_', ' '),
        description: r.reason,
      });
    });

    // Apply Filter if selected
    const filteredNodes = nodes.filter((n) => {
      if (n.kind === 'tender-root') return true;
      if (tenderFilterStatus === 'all') return true;
      if (tenderFilterStatus === 'pending') {
        return !n.reviewStatus || n.reviewStatus === 'pending';
      }
      return n.reviewStatus === tenderFilterStatus;
    });

    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = links.filter((l) => visibleNodeIds.has(l.source) && visibleNodeIds.has(l.target));

    return {
      nodes: filteredNodes,
      links: filteredLinks,
      nodePositions: posMap,
    };
  }, [currentRec, tenderFilterStatus]);

  // Selected Tender Node for Inspector - resolves against full currentRec so drawer persists across status changes
  const selectedTenderNode = useMemo(() => {
    if (!selectedTenderNodeId || !currentRec) return null;
    const stdLower = selectedTenderNodeId.toLowerCase().trim();

    if (stdLower === 'tender-spec-root') {
      return {
        id: 'tender-spec-root',
        label: 'TENDER REQUIREMENT',
        title: currentRec.extractedRequirements.productName || 'Procurement Tender',
        category: currentRec.extractedRequirements.category || 'General',
        kind: 'tender-root' as const,
      };
    }

    const primaryMatch = currentRec.primaryRecommendations.find(
      (p) => p.standardId.toLowerCase().trim() === stdLower
    );
    if (primaryMatch) {
      return {
        id: primaryMatch.standardId,
        label: primaryMatch.standardNumber,
        title: primaryMatch.title,
        category: primaryMatch.category,
        kind: 'primary' as const,
        score: primaryMatch.relevanceScore,
        reviewStatus: primaryMatch.reviewStatus,
        whyRecommended: primaryMatch.whyRecommended,
        year: primaryMatch.year,
        status: primaryMatch.status,
        scope: primaryMatch.scope,
        mandatoryParameters: primaryMatch.mandatoryParameters,
      };
    }

    const relatedMatch = currentRec.relatedStandards.find(
      (r) => r.standardId.toLowerCase().trim() === stdLower
    );
    if (relatedMatch) {
      return {
        id: relatedMatch.standardId,
        label: relatedMatch.standardNumber,
        title: relatedMatch.title,
        category: currentRec.extractedRequirements.category,
        kind: 'related' as const,
        relationshipType: relatedMatch.relationshipType,
        reviewStatus: relatedMatch.reviewStatus,
        reason: relatedMatch.reason,
        parentStandardNumber: relatedMatch.parentStandardNumber,
        year: relatedMatch.year,
      };
    }

    return null;
  }, [selectedTenderNodeId, currentRec]);

  // Computed approval, rejection, and pending counts for tender
  const totalTenderStandards = currentRec
    ? currentRec.primaryRecommendations.length + currentRec.relatedStandards.length
    : 0;

  const approvedPrimaryCount = currentRec
    ? currentRec.primaryRecommendations.filter((p) => p.reviewStatus === 'approved').length
    : 0;
  const approvedRelatedCount = currentRec
    ? currentRec.relatedStandards.filter((r) => r.reviewStatus === 'approved').length
    : 0;
  const totalTenderApproved = approvedPrimaryCount + approvedRelatedCount;

  const rejectedPrimaryCount = currentRec
    ? currentRec.primaryRecommendations.filter((p) => p.reviewStatus === 'rejected').length
    : 0;
  const rejectedRelatedCount = currentRec
    ? currentRec.relatedStandards.filter((r) => r.reviewStatus === 'rejected').length
    : 0;
  const totalTenderRejected = rejectedPrimaryCount + rejectedRelatedCount;

  const pendingPrimaryCount = currentRec
    ? currentRec.primaryRecommendations.filter((p) => !p.reviewStatus || p.reviewStatus === 'pending').length
    : 0;
  const pendingRelatedCount = currentRec
    ? currentRec.relatedStandards.filter((r) => !r.reviewStatus || r.reviewStatus === 'pending').length
    : 0;
  const totalTenderPending = pendingPrimaryCount + pendingRelatedCount;

  const handleResetCatalogView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedCategory('All');
    setSelectedRelType('All');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-800 mb-1">
            <Layers className="w-4 h-4 text-blue-700" />
            <span>Graph-Based Standards Discovery & Procurement Verification</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Standards Knowledge Graph</h2>
          <p className="text-sm text-slate-600 mt-1">
            Explore interconnected Indian Standards catalog network or inspect dedicated relationship topologies for generated tender recommendations.
          </p>
        </div>

        {/* View Mode Toggle: Catalog vs Tender Graph */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
          <button
            id="tab-catalog-graph"
            onClick={() => {
              setActiveTabMode('catalog');
              setSelectedTenderNodeId(null);
            }}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all ${activeTabMode === 'catalog'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-700" />
            <span>Complete Catalog Graph</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-mono">
              {graphData.nodes.length}
            </span>
          </button>

          <button
            id="tab-tender-graph"
            onClick={() => {
              setActiveTabMode('tender');
              setSelectedNode(null);
            }}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all ${activeTabMode === 'tender'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Tender Recommendation Graph</span>
            {currentRec && (
              <span className="flex items-center space-x-1 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold">
                  {totalTenderApproved} ✓
                </span>
                {totalTenderRejected > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold">
                    {totalTenderRejected} ✗
                  </span>
                )}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: TENDER RECOMMENDATION KNOWLEDGE GRAPH */}
      {/* ========================================================================= */}
      {activeTabMode === 'tender' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Active Tender Context Strip */}
          {currentRec ? (
            <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider border border-amber-400/30">
                    Active Tender Specification
                  </span>
                  <span className="text-xs text-slate-300 font-mono">ID: {currentRec.recommendationId}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    Approved: {totalTenderApproved}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center">
                    <X className="w-3.5 h-3.5 mr-1 text-rose-400" />
                    Rejected: {totalTenderRejected}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
                    Pending: {totalTenderPending}
                  </span>
                  <span className="text-xs text-slate-300">
                    (Total: {totalTenderStandards} Standards)
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {currentRec.extractedRequirements.productName || 'Procurement Tender Requirement'}
                </h3>
                <p className="text-xs text-slate-300">
                  Domain: <strong>{currentRec.extractedRequirements.category}</strong> • Operating Context:{' '}
                  <strong>{currentRec.extractedRequirements.environment}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {onNavigateToTender && (
                  <button
                    onClick={onNavigateToTender}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-medium flex items-center space-x-1 transition-colors"
                  >
                    <span>Back to Tender Analysis</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={() => setShowSummaryModal(true)}
                  className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate Final Summary</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Tender Recommendation Generated Yet</h3>
              <p className="text-xs text-slate-600 max-w-lg mx-auto">
                Generate a tender recommendation in the <strong>Tender Specification Generator</strong> or load one of our realistic BIS sample tenders to explore its specific knowledge graph topology.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  disabled={tenderLoading}
                  onClick={() => handleLoadSampleTender('lighting')}
                  className="px-3.5 py-2 rounded bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load LED Street Light Tender Graph</span>
                </button>
                <button
                  disabled={tenderLoading}
                  onClick={() => handleLoadSampleTender('cement')}
                  className="px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load 53 Grade OPC Cement Tender Graph</span>
                </button>
              </div>
            </div>
          )}

          {/* Tender Graph Filter & Legend Bar */}
          {currentRec && (
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Filter Status:</span>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => setTenderFilterStatus('all')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${tenderFilterStatus === 'all'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    All Standards ({totalTenderStandards})
                  </button>
                  <button
                    onClick={() => setTenderFilterStatus('approved')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${tenderFilterStatus === 'approved'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>Approved Only ({totalTenderApproved})</span>
                  </button>
                  <button
                    onClick={() => setTenderFilterStatus('rejected')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${tenderFilterStatus === 'rejected'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                      }`}
                  >
                    <X className="w-3 h-3" />
                    <span>Rejected Only ({totalTenderRejected})</span>
                  </button>
                  <button
                    onClick={() => setTenderFilterStatus('pending')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${tenderFilterStatus === 'pending'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                      }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Pending Review ({totalTenderPending})</span>
                  </button>
                </div>
              </div>

              {/* Status Visual Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-700 flex items-center justify-center text-white text-[8px] font-bold">
                    ✓
                  </span>
                  <span className="text-slate-700 font-medium">Approved for Tender</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600 border border-blue-700"></span>
                  <span className="text-slate-700 font-medium">Suggested Candidate</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600 flex items-center justify-center text-white text-[8px] font-bold">
                    ✗
                  </span>
                  <span className="text-slate-700 font-medium">Excluded / Rejected</span>
                </div>
              </div>
            </div>
          )}

          {/* Tender Graph SVG Canvas & Detail Drawer */}
          {currentRec && (
            <div className="relative bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
              {/* Interactive Canvas */}
              <div className="flex-1 relative overflow-auto bg-slate-50/60 p-4 min-h-[560px]">
                <svg
                  viewBox="0 0 850 600"
                  className="w-full h-full min-w-[750px] min-h-[560px] transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                    transformOrigin: 'center center',
                  }}
                >
                  <defs>
                    <marker
                      id="arrow-tender-primary"
                      viewBox="0 -5 10 10"
                      refX="26"
                      refY="0"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                    >
                      <path d="M0,-5L10,0L0,5" fill="#4f46e5" />
                    </marker>
                    <marker
                      id="arrow-tender-related"
                      viewBox="0 -5 10 10"
                      refX="26"
                      refY="0"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                    >
                      <path d="M0,-5L10,0L0,5" fill="#059669" />
                    </marker>
                  </defs>

                  {/* Tier Zone Guides */}
                  <g className="tier-zones opacity-20">
                    <rect x="50" y="30" width="750" height="100" rx="10" fill="#e0e7ff" />
                    <rect x="50" y="190" width="750" height="120" rx="10" fill="#f0fdf4" />
                    <rect x="50" y="370" width="750" height="200" rx="10" fill="#f8fafc" />
                  </g>

                  {/* Tier Labels */}
                  <g className="tier-labels text-[10px] font-bold fill-slate-400 select-none uppercase tracking-wider">
                    <text x="70" y="55">Tier 1 • Procurement Specification Requirement</text>
                    <text x="70" y="215">Tier 2 • Primary AI-Recommended Product Standards</text>
                    <text x="70" y="395">Tier 3 • Connected Normative, Safety & Test Method Codes</text>
                  </g>

                  {/* Links */}
                  <g className="tender-links">
                    {tenderGraphTopology.links.map((link, idx) => {
                      const srcPos = tenderGraphTopology.nodePositions.get(link.source);
                      const tgtPos = tenderGraphTopology.nodePositions.get(link.target);
                      if (!srcPos || !tgtPos) return null;

                      const isHighlighted =
                        selectedTenderNodeId &&
                        (selectedTenderNodeId === link.source || selectedTenderNodeId === link.target);

                      const isPrimary = link.type === 'PRIMARY_RECOMMENDATION';
                      const strokeColor = isPrimary ? '#4f46e5' : '#059669';

                      return (
                        <g key={`tlink-${idx}`}>
                          <line
                            x1={srcPos.x}
                            y1={srcPos.y}
                            x2={tgtPos.x}
                            y2={tgtPos.y}
                            stroke={strokeColor}
                            strokeWidth={isHighlighted ? 3.5 : 2}
                            strokeOpacity={isHighlighted ? 1 : 0.75}
                            strokeDasharray={isPrimary ? 'none' : '4 3'}
                            markerEnd={`url(#arrow-tender-${isPrimary ? 'primary' : 'related'})`}
                          />
                          {/* Label in middle of line */}
                          <text
                            x={(srcPos.x + tgtPos.x) / 2}
                            y={(srcPos.y + tgtPos.y) / 2 - 6}
                            textAnchor="middle"
                            fontSize="9px"
                            fontWeight="bold"
                            fill="#475569"
                            className="select-none bg-white px-1"
                          >
                            {link.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* Nodes */}
                  <g className="tender-nodes">
                    {tenderGraphTopology.nodes.map((node) => {
                      const pos = tenderGraphTopology.nodePositions.get(node.id) || { x: 400, y: 300 };
                      const isSelected = selectedTenderNodeId === node.id;

                      // Root Node Rendering
                      if (node.kind === 'tender-root') {
                        return (
                          <g
                            key={node.id}
                            transform={`translate(${pos.x}, ${pos.y})`}
                            className="cursor-pointer transition-transform hover:scale-105"
                            onClick={() => setSelectedTenderNodeId(node.id)}
                          >
                            <rect
                              x="-140"
                              y="-30"
                              width="280"
                              height="60"
                              rx="8"
                              fill="#1e1b4b"
                              stroke="#6366f1"
                              strokeWidth="2.5"
                              className="shadow-md"
                            />
                            <text
                              y="-6"
                              textAnchor="middle"
                              fontSize="11px"
                              fontWeight="bold"
                              fill="#f8fafc"
                              className="select-none uppercase tracking-wider"
                            >
                              TENDER REQUIREMENT
                            </text>
                            <text
                              y="14"
                              textAnchor="middle"
                              fontSize="10px"
                              fontWeight="normal"
                              fill="#cbd5e1"
                              className="select-none font-medium"
                            >
                              {node.title.length > 32 ? node.title.slice(0, 30) + '...' : node.title}
                            </text>
                          </g>
                        );
                      }

                      // Standard Nodes (Primary & Related)
                      const isApproved = node.reviewStatus === 'approved';
                      const isRejected = node.reviewStatus === 'rejected';

                      const fillColor = isApproved ? '#ecfdf5' : isRejected ? '#fef2f2' : '#eff6ff';
                      const strokeColor = isApproved ? '#059669' : isRejected ? '#e11d48' : '#2563eb';
                      const textColor = isApproved ? '#065f46' : isRejected ? '#9f1239' : '#1e40af';

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${pos.x}, ${pos.y})`}
                          className="cursor-pointer transition-transform hover:scale-110"
                          onClick={() => setSelectedTenderNodeId(node.id)}
                        >
                          {/* Outer Circle */}
                          <circle
                            r={isSelected ? 28 : 24}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={isSelected ? 3.5 : 2.5}
                            strokeDasharray={isRejected ? '4 3' : 'none'}
                            className="shadow-sm"
                          />

                          {/* Status Badge in upper corner */}
                          {isApproved && (
                            <g transform="translate(14, -14)">
                              <circle r="9" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
                              <text
                                y="3"
                                textAnchor="middle"
                                fontSize="10px"
                                fontWeight="bold"
                                fill="#ffffff"
                                className="select-none"
                              >
                                ✓
                              </text>
                            </g>
                          )}
                          {isRejected && (
                            <g transform="translate(14, -14)">
                              <circle r="9" fill="#e11d48" stroke="#ffffff" strokeWidth="1.5" />
                              <text
                                y="3"
                                textAnchor="middle"
                                fontSize="10px"
                                fontWeight="bold"
                                fill="#ffffff"
                                className="select-none"
                              >
                                ✗
                              </text>
                            </g>
                          )}
                          {!isApproved && !isRejected && node.score && (
                            <g transform="translate(14, -14)">
                              <circle r="9" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                              <text
                                y="3"
                                textAnchor="middle"
                                fontSize="8px"
                                fontWeight="bold"
                                fill="#ffffff"
                                className="select-none"
                              >
                                {node.score}%
                              </text>
                            </g>
                          )}

                          {/* Standard Number */}
                          <text
                            y={3}
                            textAnchor="middle"
                            fontSize="9px"
                            fontWeight="bold"
                            fill={textColor}
                            className="select-none font-mono"
                          >
                            {node.label.replace('IS ', '')}
                          </text>

                          {/* Kind badge under node */}
                          <text
                            y={36}
                            textAnchor="middle"
                            fontSize="8px"
                            fontWeight="bold"
                            fill={isApproved ? '#059669' : '#475569'}
                            className="select-none uppercase"
                          >
                            {isApproved
                              ? 'Approved ✓'
                              : node.kind === 'primary'
                                ? 'Primary Match'
                                : 'Allied Reference'}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Bottom Canvas Overlay Note */}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-300 rounded px-3 py-1.5 text-[11px] text-slate-700 shadow-xs flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>Click any standard node to inspect requirements or approve/reject for tender annexure.</span>
                </div>
              </div>

              {/* Tender Standard Detail & Review Action Drawer */}
              {selectedTenderNode && (
                <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-5 overflow-y-auto space-y-4 animate-slideLeft">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-blue-800">
                      Tender Standard Inspector
                    </span>
                    <button
                      onClick={() => setSelectedTenderNodeId(null)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {selectedTenderNode.kind === 'tender-root' ? (
                    <div className="space-y-3 text-xs">
                      <h4 className="font-bold text-slate-900 text-base">{selectedTenderNode.title}</h4>
                      <p className="text-slate-600 leading-relaxed">
                        This is the central procurement specification extracted from the user input. The graph branches to candidate Indian Standards and their normative references.
                      </p>
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <strong className="text-blue-900 block mb-1">Tender Requirements:</strong>
                        <ul className="list-disc list-inside space-y-1 text-slate-700">
                          {(currentRec.extractedRequirements.keyRequirements || []).map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                            {selectedTenderNode.label}
                          </span>
                          {selectedTenderNode.score && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-800 text-white">
                              {selectedTenderNode.score}% Match
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{selectedTenderNode.title}</h4>
                      </div>

                      {/* Status Tag */}
                      <div className="p-2.5 rounded border text-xs flex items-center justify-between"
                        style={{
                          backgroundColor:
                            selectedTenderNode.reviewStatus === 'approved'
                              ? '#ecfdf5'
                              : selectedTenderNode.reviewStatus === 'rejected'
                                ? '#fef2f2'
                                : '#f8fafc',
                          borderColor:
                            selectedTenderNode.reviewStatus === 'approved'
                              ? '#a7f3d0'
                              : selectedTenderNode.reviewStatus === 'rejected'
                                ? '#fecdd3'
                                : '#e2e8f0',
                        }}
                      >
                        <span className="font-bold text-slate-700">Officer Verification:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded uppercase text-[10px] ${selectedTenderNode.reviewStatus === 'approved'
                              ? 'bg-emerald-600 text-white'
                              : selectedTenderNode.reviewStatus === 'rejected'
                                ? 'bg-rose-600 text-white'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                        >
                          {selectedTenderNode.reviewStatus === 'approved'
                            ? 'Approved for Annexure ✓'
                            : selectedTenderNode.reviewStatus === 'rejected'
                              ? 'Rejected / Excluded ✗'
                              : 'Pending Officer Review ⏳'}
                        </span>
                      </div>

                      {/* Procurement Officer Actions in Graph */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                          Officer Decision Action:
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleReviewActionInGraph(selectedTenderNode.id, 'approve')}
                            className={`flex-1 py-2 px-3 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-xs ${selectedTenderNode.reviewStatus === 'approved'
                                ? 'bg-emerald-700 text-white ring-2 ring-emerald-500 hover:bg-emerald-800'
                                : 'bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            title={
                              selectedTenderNode.reviewStatus === 'approved'
                                ? 'Click to undo approval'
                                : 'Approve for tender annexure'
                            }
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{selectedTenderNode.reviewStatus === 'approved' ? 'Approved ✓' : 'Approve'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReviewActionInGraph(selectedTenderNode.id, 'reject')}
                            className={`flex-1 py-2 px-3 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-xs ${selectedTenderNode.reviewStatus === 'rejected'
                                ? 'bg-rose-700 text-white ring-2 ring-rose-500 hover:bg-rose-800'
                                : 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-50'
                              }`}
                            title={
                              selectedTenderNode.reviewStatus === 'rejected'
                                ? 'Click to undo rejection'
                                : 'Reject standard'
                            }
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{selectedTenderNode.reviewStatus === 'rejected' ? 'Rejected ✗' : 'Reject'}</span>
                          </button>
                        </div>
                        {selectedTenderNode.reviewStatus !== 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleReviewActionInGraph(selectedTenderNode.id, 'reset')}
                            className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800 underline pt-1"
                          >
                            Reset Decision Back to Pending
                          </button>
                        )}
                      </div>

                      {/* Why Recommended / Rationale */}
                      {(selectedTenderNode.whyRecommended || selectedTenderNode.reason) && (
                        <div className="text-xs text-slate-700 bg-blue-50/60 p-3 rounded border border-blue-200 leading-relaxed">
                          <strong className="text-blue-900 block mb-1">Recommendation Context:</strong>
                          <p>{selectedTenderNode.whyRecommended || selectedTenderNode.reason}</p>
                        </div>
                      )}

                      {/* Technical Checklist if available */}
                      {selectedTenderNode.mandatoryParameters && (
                        <div className="space-y-1.5 text-xs">
                          <strong className="text-slate-800 block">Mandatory Technical Checklist:</strong>
                          <ul className="space-y-1">
                            {selectedTenderNode.mandatoryParameters.map((param, i) => (
                              <li
                                key={i}
                                className="flex items-start space-x-1.5 text-slate-600 bg-slate-50 p-1.5 rounded"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{param}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: COMPLETE BIS STANDARDS CATALOG GRAPH (EXISTING DETAILED GRAPH) */}
      {/* ========================================================================= */}
      {activeTabMode === 'catalog' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search standard number or title in catalog..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-600">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="All">All Categories ({graphData.nodes.length})</option>
                <option value="Lighting">Lighting</option>
                <option value="Industrial Safety">Industrial Safety</option>
                <option value="Electrical">Electrical</option>
                <option value="Water & Plumbing">Water & Plumbing</option>
                <option value="Construction & Materials">Construction & Materials</option>
              </select>
            </div>

            {/* Relationship Type Filter */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-600">Relationship Type:</span>
              <select
                value={selectedRelType}
                onChange={(e) => setSelectedRelType(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="All">All Relationship Types</option>
                <option value="NORMATIVE_REFERENCE">Normative Reference</option>
                <option value="TEST_METHOD">Test Method</option>
                <option value="SAFETY_STANDARD">Safety Standard</option>
                <option value="MATERIAL_STANDARD">Material Standard</option>
                <option value="INSTALLATION_STANDARD">Installation Standard</option>
                <option value="RELATED_TO">Allied Standard</option>
              </select>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
                className="p-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
                className="p-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetCatalogView}
                className="px-2.5 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Relationship Legend */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Relationship Types:</span>
            <div className="flex flex-wrap items-center gap-3">
              {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center space-x-1.5">
                  <span className="w-3 h-1 rounded" style={{ backgroundColor: color }}></span>
                  <span className="text-slate-600 font-medium text-[11px]">{type.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Canvas + Detail Drawer */}
          <div className="relative bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[620px]">
            {/* SVG Graph Canvas */}
            <div className="flex-1 relative overflow-auto bg-slate-50 p-4 min-h-[580px]">
              {loading ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Loading Knowledge Graph Topology...
                </div>
              ) : (
                <svg
                  viewBox="0 0 850 680"
                  className="w-full h-full min-w-[750px] min-h-[580px] transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                    transformOrigin: 'center center',
                  }}
                >
                  <defs>
                    {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
                      <marker
                        key={`arrow-${type}`}
                        id={`arrow-${type}`}
                        viewBox="0 -5 10 10"
                        refX="22"
                        refY="0"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto"
                      >
                        <path d="M0,-5L10,0L0,5" fill={color} />
                      </marker>
                    ))}
                  </defs>

                  {/* Cluster Boundaries Background */}
                  <g className="cluster-zones opacity-40">
                    <circle cx="200" cy="180" r="140" fill="#fef3c7" stroke="#d97706" strokeDasharray="4 4" />
                    <circle cx="620" cy="160" r="140" fill="#fee2e2" stroke="#dc2626" strokeDasharray="4 4" />
                    <circle cx="420" cy="380" r="150" fill="#dbeafe" stroke="#2563eb" strokeDasharray="4 4" />
                    <circle cx="180" cy="520" r="130" fill="#cffafe" stroke="#0891b2" strokeDasharray="4 4" />
                    <circle cx="650" cy="500" r="140" fill="#f5f5f4" stroke="#78716c" strokeDasharray="4 4" />
                  </g>

                  {/* Cluster Labels */}
                  <g className="cluster-labels text-[11px] font-bold fill-slate-400 select-none">
                    <text x="200" y="45" textAnchor="middle">LIGHTING</text>
                    <text x="620" y="25" textAnchor="middle">INDUSTRIAL SAFETY</text>
                    <text x="420" y="240" textAnchor="middle">ELECTRICAL DISTRIBUTION</text>
                    <text x="180" y="660" textAnchor="middle">WATER & PLUMBING</text>
                    <text x="650" y="660" textAnchor="middle">CONSTRUCTION MATERIALS</text>
                  </g>

                  {/* Graph Edges / Links */}
                  <g className="links">
                    {filteredCatalogLinks.map((link, idx) => {
                      const srcPos = nodePositions.get(link.source);
                      const tgtPos = nodePositions.get(link.target);
                      if (!srcPos || !tgtPos) return null;

                      const color = RELATIONSHIP_COLORS[link.type] || '#94a3b8';
                      const isHighlighted =
                        selectedNode &&
                        (selectedNode.standardId === link.source || selectedNode.standardId === link.target);

                      return (
                        <g key={`edge-${idx}`}>
                          <line
                            x1={srcPos.x}
                            y1={srcPos.y}
                            x2={tgtPos.x}
                            y2={tgtPos.y}
                            stroke={color}
                            strokeWidth={isHighlighted ? 3 : 1.5}
                            strokeOpacity={isHighlighted ? 1 : 0.7}
                            markerEnd={`url(#arrow-${link.type})`}
                          />
                        </g>
                      );
                    })}
                  </g>

                  {/* Graph Nodes */}
                  <g className="nodes">
                    {filteredCatalogNodes.map((node) => {
                      const pos = nodePositions.get(node.id) || { x: 400, y: 300 };
                      const colorTheme = CATEGORY_COLORS[node.category] || {
                        bg: '#f1f5f9',
                        stroke: '#475569',
                        text: '#1e293b',
                      };
                      const isSelected = selectedNode?.standardId === node.id;

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${pos.x}, ${pos.y})`}
                          className="cursor-pointer transition-transform hover:scale-110"
                          onClick={() => handleNodeClick(node.id)}
                        >
                          <circle
                            r={isSelected ? 22 : 17}
                            fill={colorTheme.bg}
                            stroke={colorTheme.stroke}
                            strokeWidth={isSelected ? 3.5 : 2}
                            className="shadow-sm"
                          />
                          <text
                            y={4}
                            textAnchor="middle"
                            fontSize={isSelected ? '9px' : '8px'}
                            fontWeight="bold"
                            fill={colorTheme.text}
                            className="select-none font-mono"
                          >
                            {node.label.split('(')[0].replace('IS ', '').trim()}
                          </text>
                          <text
                            y={28}
                            textAnchor="middle"
                            fontSize="8px"
                            fontWeight="600"
                            fill="#334155"
                            className="select-none"
                          >
                            {node.label.length > 20 ? node.label.slice(0, 18) + '..' : node.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              )}

              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs border border-slate-300 rounded px-2.5 py-1 text-[11px] text-slate-600 shadow-xs">
                Showing {filteredCatalogNodes.length} Standards & {filteredCatalogLinks.length} Active Connections • Click any node to inspect details
              </div>
            </div>

            {/* Selected Standard Inspector Drawer */}
            {selectedNode && (
              <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-5 overflow-y-auto space-y-4 animate-slideLeft">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-blue-800">
                    Standard Details Inspector
                  </span>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                    {selectedNode.standardNumber}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedNode.title}</h4>

                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Year: {selectedNode.year}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Status: {selectedNode.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">{selectedNode.category}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                  <strong className="text-slate-800 block mb-1">Standard Scope:</strong>
                  {selectedNode.scope}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800 block">Direct Graph Connections:</span>
                  <div className="space-y-1.5 text-xs">
                    {graphData.links
                      .filter(
                        (l) => l.source === selectedNode.standardId || l.target === selectedNode.standardId
                      )
                      .map((link, idx) => {
                        const isOutbound = link.source === selectedNode.standardId;
                        const connectedId = isOutbound ? link.target : link.source;
                        const connectedNode = graphData.nodes.find((n) => n.id === connectedId);

                        return (
                          <div
                            key={idx}
                            onClick={() => handleNodeClick(connectedId)}
                            className="p-2 rounded bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono font-bold text-blue-900">
                                {connectedNode?.label || connectedId}
                              </span>
                              <span
                                className="font-semibold text-[10px] uppercase"
                                style={{ color: RELATIONSHIP_COLORS[link.type] || '#475569' }}
                              >
                                {isOutbound
                                  ? `→ ${link.type.replace('_', ' ')}`
                                  : `← ${link.type.replace('_', ' ')}`}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{link.description}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div>Source: {selectedNode.source.sourceName}</div>
                  <div>Last Verified: {selectedNode.source.lastVerified}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tender Summary Modal from Graph */}
      {showSummaryModal && currentRec && (
        <TenderSummaryModal
          isOpen={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          recommendation={currentRec}
          approvedPrimary={currentRec.primaryRecommendations.filter((p) => p.reviewStatus === 'approved')}
          approvedRelated={currentRec.relatedStandards.filter((r) => r.reviewStatus === 'approved')}
        />
      )}
    </div>
  );
};

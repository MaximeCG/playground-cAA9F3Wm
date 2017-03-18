import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Observable;
import java.util.Scanner;
import java.util.Set;
import java.util.Stack;
import java.util.TreeSet;



class Referee extends SoloReferee {
	public static enum Difficulty{
		DUMB, // direct to nearest accessible exit
		AVERAGE, // direct to nearest accessible exit OR double node
		CLEVER, // direct to nearest accessible double node if possible, then to nearest accessible exit (warning, node next to exit does not count in the dijkstra cost)
		LOCKED // CLEVER, but only edges adjacent to exit node can be cut
	}

	private static final boolean DEBUG=false;
	private Graph graph;

	@Override
	protected String getGameName() {
		return "SKYNET-FINAL";
	}

	@Override
	protected void handleInitInputForReferee(String[] initLines) {
		graph=new Graph().parse(initLines);
		nbEdges = graph.getEdges().size();
//		View.show(graph);
	}

	@Override
	protected void handlePlayerOutput(String[] playerOutput) {
		try {
			if(DEBUG) {
				synchronized(graph) {
					graph.wait();
				}
			}
			if(!playerOutput[0].trim().equalsIgnoreCase("WAIT")) {
				String[] input=playerOutput[0].split(" ");
				int a=Integer.parseInt(input[0]);
				int b=Integer.parseInt(input[1]);
				graph.cutEdge(a, b);
			}
			if(DEBUG) {
				synchronized(graph) {
					graph.wait();
				}
			}
			graph.nextStep();
			// Should set variable "win", "lost" if needed. If "win" or "lost" are true, "reason" and "reasonCode" must be set.
		} catch(NoSuchEdgeException e) {
			super.lost=true;
			this.reason="Failure: "+e.getMessage();
			this.reasonCode="NoSuchLink";
		} catch(NoSuchNodeException e) {
			super.lost=true;
			this.reason="Failure: "+"No such node "+e.getIndex();
			this.reasonCode="NoSuchNode";
		} catch(LostException e) {
			super.lost=true;
			this.reason="Failure: "+e.getReason();
			this.reasonCode=e.getReasonCode();
		} catch(WinException e) {
			super.win=true;
			this.reason="Success: "+e.getReason();
			this.reasonCode=e.getReasonCode();
		} catch(Throwable t) {
			t.printStackTrace();
			super.lost=true;
			this.reason="Failure: Invalid input";
			this.reasonCode="InvalidInput";
		}
	}

	@Override
	protected String[] getInitInputForPlayer() {
		return graph.getPlayerInit();
	}

	@Override
	protected String[] getInputForPlayer() {
		return graph.getPlayerInput();
	}

	@Override
	protected String[] getAdditionalFrameDataAtGameStartForView() {
		return graph.getViewInit();
	}

	@Override
	protected String[] getFrameDataForView() {
		return graph.getViewInput();
	}

	@Override
	protected String getHeadlineAtGameStartForConsole() {
		return "Block the Agent!";
		// returns a line like "Game starting...". Displayed as the first line in the console for round 0. May be null.
	}
	@Override
	protected String getHeadlineForConsole() {
		// returns a line like "Thor is moving to (2,3)". Displayed as the first line in the console. May be null.
		// Not used when win or lost is set
		return null;
	}

	@Override
	protected String[] getTextForConsole() {
		if(!win)
			return new String[] {graph.getLastPlayerActionString(), graph.getLastAgentActionString()};
		else
			return new String[] {graph.getLastPlayerActionString()};
	}

	@Override
	protected String getMetadata() {
		return Integer.toString(graph.getNbEdgesRemaining());
	}


	@Override
	protected int getMillisTimeForFirstRound() {
//		return 100000;
		return super.getMillisTimeForFirstRound();
	}

	@Override
	protected int getMillisTimeForRound() {
		return super.getMillisTimeForRound();
	}

	@Override
	protected String getLostTimeoutReason() {
		return super.getLostTimeoutReason();
	}

	@Override
	protected int getPlayerNbExpectedOutputLines() {
		return super.getPlayerNbExpectedOutputLines();
	}

	public static void main(String[] args) {
		try {
			new Referee(System.in, System.out, System.err);
		} catch (Throwable t) {
			try {
				PrintStream ps = new PrintStream(new FileOutputStream(LOG_FILE));
				t.printStackTrace(ps);
				ps.close();
				t.printStackTrace();
			} catch (IOException ioe) {
				System.err.println("I die and the world will not know");
				t.printStackTrace();
			}
		}
	}
	public Referee(InputStream in, PrintStream out, PrintStream err) throws Exception {
		super(in, out, err);
	}
}


class DijkstraNode implements Comparable<DijkstraNode>{
	private DijkstraNode previous;
	private Node node;
	private int cost;
	public DijkstraNode(DijkstraNode previous, Node node) {
		this.previous = previous;
		this.node = node;
		if(previous==null) {
			this.cost=0;
		} else {
			this.cost=previous.cost+1;
			// si on part d'un noeud adjacent à une sortie, c'est gratuit
			if(previous.node.getAccessibleExitCount()>0 && node.getAccessibleExitCount()<=1)
				this.cost-=1;
		}
	}
	@Override
	public int hashCode() {
		return node.hashCode();
	}
	@Override
	public boolean equals(Object o) {
		return ((DijkstraNode)o).node==node;
	}
	public int getCost() {
		return cost;
	}
	@Override
	public int compareTo(DijkstraNode other) {
		int diff=getCost()-other.getCost();
		if(diff==0) diff=other.node.getAccessibleExitCount()-node.getAccessibleExitCount();
		if(diff==0) diff=other.node.getAccessibleNodesCount()-node.getAccessibleNodesCount();
		if(diff==0) diff=node.getIndex()-other.node.getIndex();
		return diff;
	}


	public List<Node> getWay() {
		List<Node> nodes=new ArrayList<>();
		DijkstraNode temp=this;
		do{
			nodes.add(0,temp.node);
		} while((temp=temp.previous)!=null);
		return nodes;
	}

	public String toString() {
		if(previous!=null)
			return previous+" => "+node.getIndex();
		else
			return node.getIndex()+"";
	}

	/**
	 *
	 * @param a
	 * @param dest
	 * @param maxSolutionCount
	 * @return
	 */
	public static List<Node> compute(Node a, Referee.Difficulty difficulty) {
		List<Node> secondChoise=null;

		Set<Node> done=new HashSet<>();
		done.add(a);
		TreeSet<DijkstraNode> stack=new TreeSet<>();
		stack.add(new DijkstraNode(null, a));
		DijkstraNode node;
		while((node=stack.pollFirst())!=null) {
			done.add(node.node);
			for(Node n:node.node.getAccessibleNodes()) {
				DijkstraNode dnode=new DijkstraNode(node, n);
				boolean found=false;
				switch(difficulty) {
				case DUMB:
					found=n.getState()==NodeState.EXIT;
					break;
				case AVERAGE:
					found=n.getState()==NodeState.EXIT||n.getAccessibleExitCount()>=2;
					break;
				case CLEVER:
				case LOCKED:
					if(n.getState()==NodeState.EXIT && secondChoise==null) {
						secondChoise=dnode.getWay();
						continue;
					}
					found=n.getAccessibleExitCount()>=2;
					break;
				}
				if(found) {
					// found
					return dnode.getWay();
				}
				if(!done.contains(n)) stack.add(dnode);
			}
		}
		return secondChoise;
	}
}

@SuppressWarnings("serial")
class NoSuchNodeException extends Exception{
	private int index;
	public NoSuchNodeException(Throwable cause, int index) {
		super(cause);
		this.index=index;
	}

	public int getIndex() {
		return index;
	}
}

@SuppressWarnings("serial")
class NoSuchEdgeException extends Exception{
	public NoSuchEdgeException(String message, Throwable cause) {
		super(message, cause);
	}

	public NoSuchEdgeException(String message) {
		super(message);
	}
}
@SuppressWarnings("serial")
class GameException extends Exception{
	public String reason;
	public String reasonCode;
	public GameException(String reason, String reasonCode) {
		this.reason = reason;
		this.reasonCode = reasonCode;
	}
	public String getReason() {
		return reason;
	}
	public String getReasonCode() {
		return reasonCode;
	}

}
@SuppressWarnings("serial")
class LostException extends GameException{
	public LostException(String reason, String reasonCode) {
		super(reason, reasonCode);
	}
}
@SuppressWarnings("serial")
class WinException extends GameException{
	public WinException(String reason, String reasonCode) {
		super(reason, reasonCode);
	}
}



class Graph extends Observable{
	private List<Node> nodes;
	private List<Edge> edges;
	private List<Node> exits;
	private Agent virus;
	private int nbEdgesRemaining;


	private Referee.Difficulty difficulty;
	private List<Edge> destroyedEdges;
	private List<String> destroyedEdgesStrings;

	public Graph() {
		exits=new ArrayList<>();
		this.nodes=new ArrayList<>();
		this.edges=new ArrayList<>();
		this.destroyedEdges=new ArrayList<>();
		this.destroyedEdgesStrings=new ArrayList<>();
		clear();
	}

	public int getNbEdgesRemaining(){
		return nbEdgesRemaining;
	}

	public String getLastAgentActionString() {
		if(virus.getWay().size()==1) {
			return "Agent is at position "+virus.getWay().get(0);
		} else {
			return "Agent moved from "+virus.getWay().get(virus.getWay().size()-2)+" to "+virus.getWay().get(virus.getWay().size()-1);

		}
	}

	public String getLastPlayerActionString() {
		if(destroyedEdges.isEmpty()) {
			return null;
		} else {
			boolean alreadySevered=false;
			Edge severed=destroyedEdges.get(destroyedEdges.size()-1);
			for(int i=0;i<destroyedEdges.size()-1 && !alreadySevered;++i) {
				if(destroyedEdges.get(i)==severed) {
					alreadySevered=true;
				}
			}

			if(alreadySevered) return "Link "+destroyedEdgesStrings.get(destroyedEdgesStrings.size()-1)+" already severed";
			else {
				nbEdgesRemaining--;
				return "Link "+destroyedEdgesStrings.get(destroyedEdgesStrings.size()-1)+" severed";
			}
		}
	}

	public Graph parse(String[] text) {
		for(int i=text.length-1;i>=0;--i) {
			int index=text[i].indexOf("#");
			if(index>=0) text[i]=text[i].substring(0, index).trim();
		}

		int line=-1;
		int count;

		for(Referee.Difficulty d:Referee.Difficulty.values()) {
			if(text[0].equalsIgnoreCase(d.name())) {
				difficulty=d;
				++line;
				break;
			}
		}
		if(difficulty==null) difficulty=Referee.Difficulty.DUMB;


		// nodes
		count=Integer.parseInt(text[++line]);
		for(int i=0;i<count;++i) {
			String[] arr=text[++line].split(" ");
			nodes.add(new Node(i, Integer.parseInt(arr[0]), Integer.parseInt(arr[1])));
		}

		// edges
		count=Integer.parseInt(text[++line]);
		nbEdgesRemaining = count;
		for(int i=0;i<count;++i) {
			String[] arr=text[++line].split(" ");
			addEdge(new Edge(i, nodes.get(Integer.parseInt(arr[0])), nodes.get(Integer.parseInt(arr[1]))));

		}

		// virus
		Node n=nodes.get(Integer.parseInt(text[++line]));
		virus=new Agent(n);
		n.setState(NodeState.CONTAMINATED);

		// exit
		count=Integer.parseInt(text[++line]);
		for(int i=count-1;i>=0;--i) {
			Node node=nodes.get(Integer.parseInt(text[++line]));
			exits.add(node);
			node.setState(NodeState.EXIT);
		}
		Collections.sort(exits);

		return this;
	}

	public String[] export() {
		List<String> content=new ArrayList<>();
		content.add(difficulty.name());
		content.add(Integer.toString(nodes.size()));
		for(Node n:nodes) content.add(n.export());
		content.add(Integer.toString(edges.size()));
		for(Edge n:edges) content.add(n.export());
		content.add(virus.export());
		content.add(Integer.toString(exits.size()));
		for(Node n:exits) content.add(Integer.toString(n.getIndex()));
		return content.toArray(new String[content.size()]);
	}

	public void clear() {
		this.edges.clear();
		this.exits.clear();
		this.nodes.clear();
		difficulty=Referee.Difficulty.DUMB;
		setChanged();notifyObservers();
	}

	public void nextStep() throws GameException {
		boolean lost=false;

		Set<Node> accessibleExit=virus.getNode().getAccessibleExits();
		List<Node> result=null;
		if(!accessibleExit.isEmpty()) {
			// le virus a gagné, et il va directement vers une des sorties
			result=Arrays.asList(virus.getNode(),accessibleExit.iterator().next());
		} else {
			result=DijkstraNode.compute(virus.getNode(), difficulty);
		}
		if(result==null) throw new WinException("Agent has been neutralized","YouWin");
		Node n=result.get(1);
		if(n.getState()==NodeState.EXIT) {
			lost=true;
		}
		virus.getNode().setState(NodeState.FREE);
		virus.setNode(n);
		virus.getNode().setState(NodeState.CONTAMINATED);

		setChanged();notifyObservers();
		if(lost) {
			throw new LostException("Agent has reached a gateway", "YouLose");
		}
	}

	public void previousStep() {
		virus.getNode().setState(NodeState.FREE);
		virus.goBack();
		virus.getNode().setState(NodeState.CONTAMINATED);
		for(Node exit:exits) exit.setState(NodeState.EXIT);
//		repair();
	}

	public String[] getPlayerInit() {
		List<String> init=new ArrayList<>();
		init.add(Integer.toString(nodes.size())+" "+Integer.toString(edges.size())+" "+Integer.toString(exits.size()));
		for(Edge edge:edges) init.add(edge.export());
		for(Node n:exits) init.add(n.toString());
		return init.toArray(new String[init.size()]);
	}

	public String[] getPlayerInput() {
		List<String> init=new ArrayList<>();
		init.add(Integer.toString(virus.getNode().getIndex()));
		return init.toArray(new String[init.size()]);
	}


	public String[] getViewInit() {
		List<String> init=new ArrayList<>();
		init.add(difficulty.name());
		init.add(Integer.toString(nodes.size())+" "+edges.size());
		for(Node node:nodes) init.add(node.export());
		for(Edge e:edges) init.add(e.export());
		init.add(explode(exits," ")+"\n");
		return init.toArray(new String[init.size()]);
	}

	public String[] getViewInput() {
		List<String> list=new ArrayList<>();
		list.add(explode(virus.getWay()," ")+"\n");
		list.add(explode(destroyedEdges," ")+"\n");
		return list.toArray(new String[list.size()]);
	}

    public static <E> String explode(Collection<E> c, String separator) {
        Iterator<E> i = c.iterator();
        if (! i.hasNext())
            return "";
        StringBuilder sb = new StringBuilder();
        for (;;) {
            E e = i.next();
            sb.append(e);
            if (!i.hasNext())
                return sb.toString();
            sb.append(separator);
        }
    }


	public void cutEdge(int nodeIndexa, int nodeIndexb) throws NoSuchNodeException, NoSuchEdgeException {
		Node a,b;
		try{
			a=nodes.get(nodeIndexa);
		} catch(IndexOutOfBoundsException e) {
			throw new NoSuchNodeException(e, nodeIndexa);
		}
		try{
			b=nodes.get(nodeIndexb);
		} catch(IndexOutOfBoundsException e) {
			throw new NoSuchNodeException(e, nodeIndexb);
		}
		cutEdge(a, b);
	}

	public void cutEdge(Node a, Node b) throws NoSuchEdgeException {
		Edge e=a.getEdge(b);
		if(e==null) throw new NoSuchEdgeException("No such link ["+a.getIndex()+"-"+b.getIndex() +"]");
		else if(difficulty==Referee.Difficulty.LOCKED && e.getA().getState()!=NodeState.EXIT && e.getB().getState()!=NodeState.EXIT) throw new NoSuchEdgeException("Link ["+a.getIndex()+"-"+b.getIndex()+"] is protected. Your virus has been destroyed while trying to severe it!");
		else {
			e.setState(EdgeState.DESTROYED);
			this.destroyedEdges.add(e);
			this.destroyedEdgesStrings.add("["+a.getIndex()+"-"+b.getIndex()+"]");
		}
		setChanged();notifyObservers();
	}

	public List<Node> getNodes() {
		return nodes;
	}

	public List<Edge> getEdges() {
		return edges;
	}

	public void addNode(Node newNode) {
		newNode.setIndex(nodes.size());
		nodes.add(newNode);
		setChanged();notifyObservers();
	}

	public void remove(Node n) {
		nodes.remove(n);
		for(Edge e:n.getEdges().toArray(new Edge[n.getEdges().size()])) {
			e.remove();
			edges.remove(e);
		}
		repair();
		setChanged();notifyObservers();
	}


	public void repair() {
		int index=0;
		exits.clear();
		boolean virusFound=false;
		for(Node n:nodes) {
			n.setIndex(index++);
			switch(n.getState()) {
			case CONTAMINATED:
				if(virusFound) {
					n.setState(NodeState.FREE);
				} else {
					virusFound=true;
					virus=new Agent(n);
				}
				break;
			case EXIT:
				exits.add(n);
				break;
			default:
				break;
			}
		}
		index=0;
		for(Edge e:edges) e.setIndex(index++);
		Collections.sort(exits);
		setChanged();notifyObservers();
	}

	public void addEdge(Edge e) {
		if(e.getA().getEdge(e.getB())!=null) {
			System.err.println("Le lien existe déjà");
			return;
		}
		if(e.getA()==e.getB()) {
			System.out.println("Un lien vers soit même n'est pas autorisé"); // 7 9
			return;
		}
		e.getA().addEdge(e);
		e.getB().addEdge(e);
		this.edges.add(e);
		repair();
	}

	public void remove(Edge e) {
		e.remove();
		this.edges.remove(e);
	}

	public Referee.Difficulty getDifficulty() {
		return difficulty;
	}
	public void setDifficulty(Referee.Difficulty difficulty) {
		this.difficulty=difficulty;
		setChanged();notifyObservers();
	}

	public void shuffleIndex() {
		Collections.shuffle(nodes);
		repair();
	}
}

enum EdgeState{
	OPEN, DESTROYED;
}

enum NodeState{
	EXIT, FREE, CONTAMINATED;
}

class Edge implements Comparable<Edge> {
	private Node a,b;
	private EdgeState state;
	private int index;
	public Edge(int index, Node a, Node b) {
		this.a=a;
		this.b=b;
		this.index=index;
		this.state=EdgeState.OPEN;
	}

	public void setIndex(int i) {
		this.index=i;
	}

	public Node getOther(Node n) {
		if(a==n) return b;
		else if(b==n) return a;
		else throw new RuntimeException();
	}
	public void remove() {
		a.removeEdge(this);
		b.removeEdge(this);
	}
	public String export() {
		return a.getIndex()+" "+b.getIndex();
	}
	public String toString() {
		return Integer.toString(index);
	}
	public Node getA() {
		return a;
	}
	public Node getB() {
		return b;
	}
	public EdgeState getState() {
		return state;
	}
	public void setState(EdgeState state) {
		this.state = state;
	}

	@Override
	public int compareTo(Edge n) {
		return index-n.index;
	}
}

class Node implements Comparable<Node>{
	private int index;
	private float x,y;
	private NodeState state;

	private Map<Node, Edge> edges;

	public Node(int index, float x, float y) {
		this.index=index;
		this.x=x;
		this.y=y;
		state=NodeState.FREE;
		this.edges=new HashMap<>();
	}

	public void setIndex(int i) {
		this.index=i;
	}

	public void removeEdge(Edge edge) {
		edges.remove(edge.getOther(this));
	}

	public int getAccessibleNodesCount() {
		int counter=0;
		for(Edge e:edges.values()) {
			if(e.getState()==EdgeState.OPEN) ++counter;
		}
		return counter;
	}

	public int getAccessibleExitCount() {
		int counter=0;
		for(Edge e:edges.values()) {
			if(e.getState()==EdgeState.OPEN && e.getOther(this).getState()==NodeState.EXIT) ++counter;
		}
		return counter;
	}

	public Set<Node> getAccessibleExits() {
		Set<Node> nodes=new TreeSet<Node>();
		for(Edge e:edges.values()) {
			Node other=e.getOther(this);
			if(e.getState()==EdgeState.OPEN && other.getState()==NodeState.EXIT) nodes.add(other);
		}
		return nodes;
	}

	public Collection<Edge> getEdges() {
		return edges.values();

	}

	public int getIndex() {
		return index;
	}

	public float getX() {
		return x;
	}

	public float getY() {
		return y;
	}

	public void addEdge(Edge edge) {
		if(edge.getA()==this) this.edges.put(edge.getB(), edge);
		else if(edge.getB()==this) this.edges.put(edge.getA(), edge);
		else throw new RuntimeException("Edge added to a node that doesn't belong to this edge");
	}


	public String export() {
		return (int)Math.round(x)+" "+(int)Math.round(y);
	}

	public String toString() {
		return String.valueOf(index);
	}

	public Edge getEdge(Node a) {
		return this.edges.get(a);
	}

	public NodeState getState() {
		return state;
	}

	public void setState(NodeState state) {
		this.state = state;
	}

	@Override
	public int compareTo(Node n) {
		return getIndex()-n.getIndex();
	}

	public Set<Node> getAccessibleNodes() {
		Set<Node> accessible=new HashSet<>();
		for(Entry<Node, Edge> n:this.edges.entrySet()) {
			if(n.getValue().getState()==EdgeState.OPEN) {
				accessible.add(n.getKey());
			}
		}
		return accessible;
	}

	public void setLocation(float x, float y) {
		this.x=x;
		this.y=y;
	}
}

class Agent implements Comparable<Agent>{
	private Stack<Node> nodes;
	public Agent(Node node) {
		nodes=new Stack<>();
		setNode(node);
	}

	public void goBack() {
		nodes.pop();
	}

	public List<Node> getWay() {
		return nodes;
	}

	public String export() {
		return Integer.toString(getNode().getIndex());
	}

	public void setNode(Node node) {
		if(this.getNode()!=null) this.getNode().setState(NodeState.FREE);
		this.nodes.push(node);
		this.getNode().setState(NodeState.CONTAMINATED);
	}

	public String toString() {
		return Integer.toString(getNode().getIndex());
	}

	public Node getNode() {
		if(nodes.isEmpty()) return null;
		return nodes.peek();
	}

	@Override
	public int compareTo(Agent vir) {
		return getNode().getIndex()-vir.getNode().getIndex();
	}
}

abstract class SoloReferee {

	protected static final File LOG_FILE = new File("/tmp/referee.log");

	private PrintStream out;
	private PrintStream err;

	int nbInitLines = 0;
	String[] initLines;
	String initHeader;
	String initInput;

	boolean firstRound = true;
	int nbRounds = 0;
	String[] lastOutput;

	int nbEdges = 0;

	boolean win = false;
	boolean lost = false;
	String reason = null;
	String reasonCode = null;

	private static String LOST_PARSING_REASON = "Failure: invalid input";
	private static String LOST_TIMEOUT_REASON = "Timeout: your program did not provide an input in due time.";

	private static final String LOST_PARSING_REASON_CODE = "INPUT";
	private static final String LOST_TIMEOUT_REASON_CODE = "TIMEOUT";

	protected abstract String getGameName();
	protected abstract void handlePlayerOutput(final String[] playerOutput);
	protected abstract void handleInitInputForReferee(final String[] initLines);
	protected abstract String[] getInitInputForPlayer();
	protected abstract String[] getInputForPlayer();
	protected abstract String getHeadlineAtGameStartForConsole();
	protected abstract String getHeadlineForConsole();
	protected abstract String[] getTextForConsole();
	protected abstract String getMetadata();
	protected abstract String[] getAdditionalFrameDataAtGameStartForView();
	protected abstract String[] getFrameDataForView();

	protected SoloReferee(InputStream in, PrintStream out, PrintStream err) throws IOException {
		this.out = out;
		this.err = err;
		start(in);
	}

	protected int getMillisTimeForFirstRound() {
		return 1000;
	}
	protected int getMillisTimeForRound() {
		return 150;
	}

	protected String getLostTimeoutReason() {
		return LOST_TIMEOUT_REASON;
	}

	protected int getPlayerNbExpectedOutputLines() {
		return 1;
	}

	protected final void start(InputStream is) throws IOException {
		Scanner s = new Scanner(is);
		while (true) {
			Command c = parseCommand(s);
			switch (c.id) {
				case Command_INIT.ID:
					initGame((Command_INIT) c);
					break;
				case Command_GET_GAME_INFO.ID:
					getGameInfo((Command_GET_GAME_INFO) c);
					break;
				case Command_SET_PLAYER_OUTPUT.ID:
					setPlayerOuput((Command_SET_PLAYER_OUTPUT) c);
					break;
				case Command_SET_PLAYER_TIMEOUT.ID:
					setPlayerTimeout((Command_SET_PLAYER_TIMEOUT) c);
					break;
			}
		}
	}

	protected final int round(double d) {
		if (d < 0) return (int) (d - 0.5);
		else return (int) (d + 0.5);
	}

	private void initGame(Command_INIT c) throws IOException {
		try {
			initLines = c.initLines;
			nbInitLines = initLines.length;
			handleInitInputForReferee(initLines);
		} catch (Exception ex) {
			// Parsing failed: assume input is bad
			lost = true;
			reason = LOST_PARSING_REASON;
			reasonCode = LOST_PARSING_REASON_CODE;
		}
	}

	private void setPlayerTimeout(Command_SET_PLAYER_TIMEOUT c) {
		lost = true;
		reason = getLostTimeoutReason();
		reasonCode = LOST_TIMEOUT_REASON_CODE;
	}

	private void setPlayerOuput(Command_SET_PLAYER_OUTPUT c) {
		lastOutput = c.output;
		handlePlayerOutput(lastOutput);
	}

	private void getGameInfo(Command_GET_GAME_INFO c) {
		String frame = "KEY_FRAME " + nbRounds;

		if (win || lost) {
			String coloredReason = lost ? ("¤RED¤" + reason + "§RED§") : ("¤GREEN¤" + reason + "§GREEN§");
			if (reasonCode == LOST_PARSING_REASON_CODE) {
				dumpResponse("VIEW", "KEY_FRAME -1", reasonCode);
				StringBuilder inputError = new StringBuilder();
				for (String initLine : initLines) {
					inputError.append(initLine);
					inputError.append('\n');
				}
				dumpResponse("INFOS", coloredReason, inputError.toString());
			} else {
				dumpResponse("VIEW", frame + " " + reasonCode, getFrameDataForView());
				dumpResponse("INFOS", coloredReason, getTextForConsole());
			}
			dumpResponse("METADATA","{\"linksRemaining\":\""+getMetadata()+"\"}");

			dumpResponse("SCORES", "0 " + (win ? "1" : "0"));
		} else if (firstRound) {
			String[] initInput = getInitInputForPlayer();
			dumpResponse("VIEW", frame, getGameName(), getAdditionalFrameDataAtGameStartForView(), getFrameDataForView());
			dumpResponse("INFOS", getHeadlineAtGameStartForConsole(), getTextForConsole());
			dumpResponse("NEXT_PLAYER_INFO", "0", "" + getPlayerNbExpectedOutputLines(), "" + getMillisTimeForFirstRound());
			dumpResponse("NEXT_PLAYER_INPUT", initInput, getInputForPlayer());
			firstRound = false;
		} else {
			dumpResponse("VIEW", frame, getFrameDataForView());
			dumpResponse("INFOS", getHeadlineForConsole(), getTextForConsole());
			dumpResponse("NEXT_PLAYER_INFO", "0", "" + getPlayerNbExpectedOutputLines(), "" + getMillisTimeForRound());
			dumpResponse("NEXT_PLAYER_INPUT", getInputForPlayer());
		}
		nbRounds++;
	}

	private void dumpResponse(String id, String first, String second, String... next) {
		dumpResponse(id, new String[] {first, second}, next);
	}

	private void dumpResponse(String id, String first, String[] second) {
		dumpResponse(id, new String[] {first}, second);
	}

	private void dumpResponse(String id, String first, String second) {
		dumpResponse(id, new String[] {first, second});
	}

	private void dumpResponse(String id, String first, String second, String[] third, String[] fourth) {
		dumpResponse(id, new String[] {first,second}, third, fourth);
	}

	private void dumpResponse(String id, String first) {
		dumpResponse(id, new String[] {first});
	}

	private void dumpResponse(String id, String[]... outputs) {
		int nbLines = 0;
		for(String[] output: outputs) {
			if (output != null) {
				for (String s : output) {
					if (s != null) {
						for(int i = 0, il  = s.length(); i < il; i++) {
							char c = s.charAt(i);
							if (c == '\n') {
								nbLines++;
							}
						}
						if (s.charAt(s.length() - 1) != '\n') {
							nbLines++;
						}
					}
				}
			}
		}

		out.println("[[" + id + "] " + nbLines + "]");
		for(String[] output: outputs) {
			if (output != null) {
				for (String s : output) {
					if (s != null) {
						out.print(s);
						if (s.charAt(s.length() - 1) != '\n') {
							out.print('\n');
						}
					}
				}
			}
		}
	}

	private Command parseCommand(Scanner s) {
		String line = s.nextLine();
		int firstClose = line.indexOf(']');
		String cmd = line.substring(2, firstClose);
		int nbLines = Integer.parseInt(line.substring(firstClose + 2, line.length() - 1));
		switch (cmd) {
			case Command_INIT.STRID:
				return new Command_INIT(s, nbLines);
			case Command_GET_GAME_INFO.STRID:
				return new Command_GET_GAME_INFO();
			case Command_SET_PLAYER_OUTPUT.STRID:
				return new Command_SET_PLAYER_OUTPUT(s, nbLines);
			case Command_SET_PLAYER_TIMEOUT.STRID:
				return new Command_SET_PLAYER_TIMEOUT();
		}
		return null;
	}

	public static class Command {
		int id;

		public Command(int id) {
			this.id = id;
		}
	}

	public static class Command_INIT extends Command {

		static final String STRID = "INIT";
		static final int ID = 0;

		int nbPlayers;
		String[] initLines;

		public Command_INIT(Scanner s, int nbLines) {
			super(ID);
			nbPlayers = s.nextInt();
			s.nextLine();
			if (nbLines > 1) {
				initLines = new String[nbLines - 1];
				for (int i = 0; i < (nbLines - 1); i++) {
					initLines[i] = s.nextLine();
				}
			} else {
				initLines = new String[0];
			}
		}
	}

	public static class Command_GET_GAME_INFO extends Command {

		static final String STRID = "GET_GAME_INFO";
		static final int ID = 1;

		public Command_GET_GAME_INFO() {
			super(ID);
		}
	}

	public static class Command_SET_PLAYER_OUTPUT extends Command {

		static final String STRID = "SET_PLAYER_OUTPUT";
		static final int ID = 2;

		String[] output;

		public Command_SET_PLAYER_OUTPUT(Scanner s, int nbLines) {
			super(ID);
			output = new String[nbLines];
			for (int i = 0; i < nbLines; i++) {
				output[i] = s.nextLine();
			}
		}
	}

	public static class Command_SET_PLAYER_TIMEOUT extends Command {

		static final String STRID = "SET_PLAYER_TIMEOUT";
		static final int ID = 3;

		public Command_SET_PLAYER_TIMEOUT() {
			super(ID);
		}
	}
}
